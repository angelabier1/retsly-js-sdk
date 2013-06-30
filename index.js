
var Retsly = module.exports = exports = (function() {

/*
 * Constructor with a internal scope reference to _this
 * _this is used for Backbone methods which aren't part of the prototype
 */

  var _this;
  var Client = function(api_key, options) {
    this.api_key = api_key;
    this.options = _.extend({ urlBase: '', debug: false }, options);
    var host = (typeof RETSLY_CONF != "undefined" && RETSLY_CONF.env === 'development') ? 'localhost:3000' : 'rets.ly';
    this.io = io.connect('http://'+host+'/');
    _this = this;
    return this;
  };

/*
 * Error Handlers
 */

  var RetslyClientError = function(msg) {
    return new Error(msg);
  };

  function RetslyClientNotFoundError() {
    return new Error('No Restly Client found. Please invoke `new Retsly($api_key)` first.');
  };

/*
 * Request API, lowest layer of socket abstraction
 */

  Client.prototype.ready = function(cb) {
    var self = this;
    if(this.options.debug) console.log('--> Loading Retsly SDK...');
    this.get('/api/v1/templates', {}, function(res) {
      if(self.options.debug) console.log('<-- Retsly SDK Loaded! App Ready!');
      if(res.success) {
        $(document.body).append('<div id="retsly-templates" />');
        $('#retsly-templates').append(res.bundle);
        if(cb && typeof cb === 'function') cb();
      }
    });
  };

  Client.prototype.request = function(url, options, cb) {
    this.io.emit('api', _.extend({ url: url }, options), cb);
  };

  Client.prototype.get = function(url, query, cb) {
    var options = {};
    options.method = 'get';
    options.query = query || {};
    options.query.api_key = this.api_key;
    return this.request(url, options, cb);
  };

  Client.prototype.post = function(url, body, cb) {
    var options = {};
    options.method = 'post';
    options.body =  body;
    options.query = { api_key: this.api_key };
    return this.request(url, options, cb);
  };

  Client.prototype.put = function(url, body, cb) {
    var options = {};
    options.method = 'put';
    options.body = body;
    options.query = { api_key: this.api_key };
    return this.request(url, options, cb);
  };

  Client.prototype.del = function(url, body, cb) {
    var options = {};
    options.method = 'delete';
    options.body = body;
    options.query = { api_key: this.api_key };
    return this.request(url, options, cb);
  };

  Client.prototype.subscribe = function(method, url, query, scb, icb) {
    var options = {};
    options.url = url;
    options.query = query;
    options.query.api_key = this.api_key;
    this.io.emit('subscribe', options, icb);
    return this.io.on(method, scb);
  };

/*  Clients don't need the ability to publish / broadcast to other clients just yet.
 *  Need to put some more thought in how this can be useful for inter client communication.
 *  Client.prototype.publish = function(url, body, cb) {
 *    this.io.emit(url, body, cb);
 *  };
 */

/*
 * Retsly Backbone sync over websockets
 */

  // If no Backbone, stop here.
  if(typeof Backbone === "undefined") return Client;

  Backbone.Model.prototype.idAttribute = "_id";
  Backbone.ajaxSync = Backbone.sync;

  Backbone.getSyncMethod = function(model) {
    if(model.transport == 'socket' || (model.collection && model.collection.transport == 'socket')) {
      return Backbone.socket;
    }
    return Backbone.ajaxSync;
  };

  Backbone.sync = function(method, model, options) {
    return Backbone.getSyncMethod(model).apply(this, [method, model, options]);
  };

/* Main socket hack for rets.ly over socket.io */

  Backbone.socket = function(method, model, options) {
    var resp, errorMessage;

    // Alway wait for server to respond
    options.wait = true;

    // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
    var methodMap = {
      'create': 'post',
      'update': 'put',
      'delete': 'del',
      'read':   'get'
    };

    // Ensure that we have a URL.
    if (!options.url) {
      options.url = _.result(model, 'url') || urlError();
    }

    var syncMethod = methodMap[method].toLowerCase();

    switch(syncMethod) {

      case 'delete':
        if(model.retsly.options.debug) console.log('--> delete '+options.url, options.data);
        model.retsly.del(options.url, model.toJSON(), function(res) {
          if(model.retsly.options.debug) console.log('<-- delete '+options.url, res);
          if(res.success) {
            if(options.success) options.success(res.bundle, options, res);
          } else {
            model.trigger('error', model, options, res);
          }
          if(model.complete) model.complete(res.bundle, options, res);
          if(typeof model.get(res.id) !== "undefined"){
            model.remove(res.bundle);
            model.trigger('remove', model.get(res.id), options, res);
          }

        });
      break;

      case 'put':
        if(model.retsly.options.debug) console.log('--> put '+options.url, model.toJSON());
        var json = model.toJSON(); delete json['_id'];
        model.retsly.put(options.url+'/'+model.get('_id'), json, function(res) {
          if(model.retsly.options.debug) console.log('<-- put '+options.url, res);
          if(res.success) {
            if(options.success) options.success(res.bundle, options, res);
          } else {
            model.trigger('error', model, res, options);
          }
          if(model.complete) model.complete(res.bundle, options, res);
          if(typeof model.get(res.id) === "undefined"){
            model.add(res.bundle);
          } else {
            model.get(res.id).set(res.bundle);
            model.trigger('change', model.get(res.id), options, res);
          }

        });
      break;

      case 'post':
        if(model.retsly.options.debug) console.log('--> post '+options.url, options.data);
        model.retsly.post(options.url, model.toJSON(), function(res) {
          if(model.retsly.options.debug) console.log('<-- post '+options.url, res);
          if(res.success) {
            if(options.success) options.success(res.bundle, options, res);
          } else {
            model.trigger('error', model, res, options);
          }
          if(model.complete) model.complete(res.bundle, options, res);
          if(typeof model.get(res.id) === "undefined"){
            model.add(res.bundle);
          } else {
            model.get(res.id).set(res.bundle);
            model.trigger('change', model.get(res.id), options, res);
          }

        });
      break;

      case 'get': default:

        if(model.retsly.options.debug) console.log('--> get '+options.url, options.data);
        model.retsly.get(options.url, options.data, function(res) {
          if(model.retsly.options.debug) console.log('<-- get '+options.url, res);

          if(res.bundle[0] && typeof res.bundle[0]._id !== 'undefined' && options.url.indexOf('photos') === -1) {

            if(model.retsly.options.debug) console.log('--> subscribe:put '+options.url, options.data);
            if(model.retsly.options.debug) console.log('--> subscribe:delete '+options.url, options.data);

            _.each(res.bundle, function(item){
              model.retsly.subscribe('put', options.url+'/'+item._id, {}, function(res) {
                //TODO: Figure out why each listing gets fired here
                if(res.id !== item._id) return;
                if(model.retsly.options.debug) console.log('<-- subscribe:put '+options.url, res);
                if(typeof model.get(res.id) === "undefined"){
                  model.add(res.bundle);
                } else {
                  model.get(res.id).set(res.bundle);
                  model.trigger('change', model.get(res.id), options, res);
                }
              });
              model.retsly.subscribe('delete', options.url+'/'+item._id, {}, function(res) {
                if(model.retsly.options.debug) console.log('<-- subscribe:delete '+options.url, res);
                if(typeof model.get(res.id) !== "undefined"){
                  model.remove(res.bundle);
                }

              });
            });

            if(model.retsly.options.debug) console.log('--> subscribe:post '+options.url, options.data);
            model.retsly.subscribe('post', options.url, {}, function(res) {
              if(model.retsly.options.debug) console.log('<-- subscribe:post '+options.url, res);
              if(typeof model.get(res.id) === "undefined"){
                model.add(res.bundle);
              } else {
                model.get(res.id).set(res.bundle);
                model.trigger('change', model.get(res.id), options, res);
              }
            });

          } /* else {

            if(model.retsly.options.debug) console.log('--> subscribe:put '+options.url, options.data);
            model.retsly.subscribe('put', options.url, {}, function(res) {
              if(model.retsly.options.debug) console.log('<-- subscribe:put '+options.url, res);
              model.trigger('change', model.get(res.id), options, res);
            });
            if(model.retsly.options.debug) console.log('--> subscribe:delete '+options.url, options.data);
            model.retsly.subscribe('delete', options.url, {}, function(res) {
              if(model.retsly.options.debug) console.log('<-- subscribe:delete '+options.url, res);
              model.trigger('remove', model, options, res);
            });
          } */

          if(res.success) {
            if(options.success) options.success(res.bundle);
            model.trigger('reset', model, options, res);
          } else {
            model.trigger('error', model, options, res);
          }
          if(model.complete) model.complete(res.bundle, options, res);

        });

      break;
    }
  };


/*
 * Public Retsly Models
 */

  Client.Models = {};
  Client.Models.Listing = Backbone.Model.extend({
    defaults: {},
    transport: 'socket',
    initialize: function(attrs, options) {

      if(typeof _this === 'undefined')
        throw new RetslyClientNotFoundError();

      if(typeof options !== 'undefined' && !options.mls_id)
        throw new Error('Retsly.Models.Listing requires a mls_id `{mls_id: mls.id}`');

      this.retsly = _this;
      this.options = _.extend({}, options);

      this.mls_id = options.mls_id;
      this.collection = options.collection;

      return this;
    },
    complete: function() {
      this.photos = new Client.Collections.Photos(this, this.options);
      this.photos.fetch();
    },
    photosComplete: function(listing) {
      if(this.collection && typeof this.collection.trigger === 'function')
        this.collection.trigger('add', listing);

      if(typeof this.options.callback === 'function')
        return this.options.callback(listing);
    },
    url: function() {
      return _this.options.urlBase+'/listing/'+this.mls_id+'/'+this.get('_id')+'.json';
    }
  });

  Client.Models.Photo = Backbone.Model.extend({
    defaults: {},
    transport: 'socket',
    initialize: function(attrs, options) {

      if(typeof _this === 'undefined')
        throw new RetslyClientNotFoundError();

      this.options = _.extend({ mls_id: this.mls_id }, options);
      this.mls_id = options.mls_id;
      this.retsly = _this;

      return this;
    },
    url: function() {
      return _this.options.urlBase+'/photo/'+this.mls_id+'/'+this.get('id')+'.json';
    }
  });

  Client.Models.Agent = Backbone.Model.extend({
    defaults: {},
    transport: 'socket',
    initialize: function(attrs, options) {

      if(typeof _this === 'undefined')
        throw new RetslyClientNotFoundError();

      this.retsly = _this;
      return this;
    },
    url: function() {
      return _this.options.urlBase+'/agent/'+this.collection.mls_id+'/'+this.get('id')+'.json';
    }
  });

  Client.Models.Office = Backbone.Model.extend({
    defaults: {},
    transport: 'socket',
    initialize: function(attrs, options) {

      if(typeof _this === 'undefined')
        throw new RetslyClientNotFoundError();

      this.retsly = _this;
      return this;
    },
    url: function() {
      return _this.options.urlBase+'/office/'+this.collection.mls_id+'/'+this.get('id')+'.json';
    }
  });

  Client.Models.Geography = Backbone.Model.extend({
    defaults: {},
    transport: 'socket',
    initialize: function(attrs, options) {

      if(typeof _this === 'undefined')
        throw new RetslyClientNotFoundError();

      this.retsly = _this;
      return this;
    },
    url: function() {
      return _this.options.urlBase+'/geography/'+this.collection.mls_id+'/'+this.get('id')+'.json';
    }
  });


/*
 * Public Retsly Collections
 */

  Client.Collections = {};
  Client.Collections.Listings = Backbone.Collection.extend({
    transport: 'socket',
    initialize: function(attrs, options) {

      if(typeof _this === 'undefined')
        throw new RetslyClientNotFoundError();

      if(typeof options !== 'undefined' && !options.mls_id)
        throw new Error('Retsly.Models.Listing requires a mls_id `{mls_id: mls.id}`');

      this.retsly = _this;
      this.options = _.extend({ }, options);
      this.mls_id = options.mls_id;
    },
    complete: function() {
      _.each(this.models, function(model) { model.complete(arguments); });
    },
    model: function(attrs, options) {
      return new Client.Models.Listing(attrs, { collection: options.collection, mls_id: options.collection.mls_id });
    },
    url: function() {
      return _this.options.urlBase+'/listing/'+this.mls_id+'.json';
    }
  });

  Client.Collections.Photos = Backbone.Collection.extend({
    transport: 'socket',
    initialize: function(listing, options) {

      if(typeof _this === 'undefined')
        throw new RetslyClientNotFoundError();

      if(typeof options !== 'undefined' && !options.mls_id)
        throw new Error('Retsly.Models.Listing requires a mls_id `{mls_id: mls.id}`');

      this.retsly = _this;
      this.listing = listing;
      this.options = _.extend({ }, options);
      this.mls_id = options.mls_id;

      this.url = _this.options.urlBase+'/photo/'+this.mls_id+'/'+listing.get('_id')+'.json';
      return this;
    },
    complete: function() {
      if(this.listing) this.listing.set('Photos', this);
      if(this.listing && typeof this.listing.photosComplete == 'function')
        this.listing.photosComplete(this.listing);
    }
  });

  Client.Collections.Agents = Backbone.Collection.extend({
    transport: 'socket',
    initialize: function(attrs, options) {

      if(typeof _this === 'undefined')
        throw new RetslyClientNotFoundError();

      this.retsly = _this;
    },
    model: function(attrs, opts) {
      return new Client.Models.Agent(attrs, opts);
    },
    url: function() {
      return _this.options.urlBase+this.mls_id+'/agent.json';
    }
  });

  Client.Collections.Offices = Backbone.Collection.extend({
    transport: 'socket',
    initialize: function(attrs, options) {

      if(typeof _this === 'undefined')
        throw new RetslyClientNotFoundError();

      this.retsly = _this;
    },
    model: function(attrs, opts) {
      return new Client.Models.Office(attrs, opts);
    },
    url: function() {
      return _this.options.urlBase+this.mls_id+'/office.json';
    }
  });

  Client.Collections.Geographies = Backbone.Collection.extend({
    transport: 'socket',
    initialize: function(attrs, options) {

      if(typeof _this === 'undefined')
        throw new RetslyClientNotFoundError();

      this.retsly = _this;
    },
    model: function(attrs, opts) {
      return new Client.Models.Geography(attrs, opts);
    },
    url: function() {
      return _this.options.urlBase+this.mls_id+'/geography.json';
    }
  });

/*
 * Public Retsly Section / View Helpers
 */

  Client.Section = Backbone.View.extend({
    open: function() {
      $(".ui-active").removeClass("ui-active");
      this.$el.addClass("ui-active");
      return this;
    }
  });

  Client.Views = {};

  return Client;

})();

