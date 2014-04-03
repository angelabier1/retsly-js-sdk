
/**
 * Dependencies
 */
var extend = require('extend');
var io = require('socket.io');
var ajax = require('ajax');
var each = require('each');

module.exports = Retsly;

var _retsly, _client, _opts;

/**
 * Core SDK
 */
function Retsly (client_id, options) {
  if (!client_id)
    throw new Error('You must provide a client_id - ie: new Retsly(\'xxx\');');

  var domain = this.getDomain();

  this.host = domain;
  this.token = null;
  this.client_id = client_id;
  this.options = extend({urlBase: '/api/v1'}, options);
  this.io = io.connect(domain, {
    'reconnection delay': 5000, // retry every 2 seconds
    'reconnection limit': 100, // defaults to Infinity
    'max reconnection attempts': Infinity // defaults to 10
  });

  this.io.on('disconnect', function() {
    if(!this.io.socket.connected)
      this.io.socket.reconnect();
  }.bind(this));

  this.__init_stack = [];
  _retsly = this;
  this.init();
}

/**
 * debug messages print if true
 */
Retsly.debug = false;

/**
 * Retsly singleton-ish
 * @return {Retsly}
 * @api public
 */
Retsly.create = function create (client, opts) {
  var s = !arguments.length;
  client = client || _client;
  opts = opts || _opts;
  if (!s && !client) throw new Error('call Retsly.create() with client id and options');
  return (s && _retsly) ? _retsly : (_retsly = new Retsly(client, opts));
}

/**
 * Set the Retsly Client ID
 */
Retsly.client = function (id) {
  _client = id;
  return Retsly;
}

/*
 * Set Retsly Options
 */
Retsly.options = function (opts) {
  _opts = opts;
  return Retsly;
}

/**
 * Initialze Retsly session
 */
Retsly.prototype.init = function() {
  var self = this;
  debug('--> Loading Retsly SDK...');

  // <!-- Make sure you ask @slajax before changing this
  // If this breaks again, you will be sorry.

  if( document.getElementById('retsly-css-sdk') ) return;

  ajax({
    type: 'POST',
    data: { origin: getOrigin(), action: 'set' },
    url: self.getURL('session'),
    xhrFields: { withCredentials: true },
    beforeSend: function(xhr) {
      xhr.withCredentials = true;
    },
    error: function (xhr,err) {throw new Error(err)},
    success: function(sid) {
      self.io.emit('authorize', { sid: sid }, function(data) {
        if(typeof data.bundle === 'string') setCookie('retsly.sid', encodeURIComponent(data.bundle));
        debug('<-- Retsly SDK Loaded!');
        self.ready();
      });
    }
  });

  var css = document.createElement('link');
    css.id = 'retsly-css-sdk';
    css.media = 'all';
    css.rel = 'stylesheet';
    css.href = getDomain()+'/css/sdk'
  document.getElementsByTagName('head')[0].appendChild(css);

  // If this breaks again, you will be sorry.
  // Make sure you ask @slajax before changing this -->
};

/**
 * Log out a Retsly session;
 */
Retsly.prototype.logout = function(cb) {
  cb = cb || function() {};
  ajax({
    type: 'POST',
    xhrFields: { withCredentials: true },
    beforeSend: function(xhr) {
      xhr.withCredentials = true;
    },
    data: { origin: getOrigin(), action: 'del' },
    url: this.getURL('session'),
    error: function (error) { throw new Error(error); },
    success: cb
  });
  return this;
};

/**
 * Set an oauth token for extended privileges on current session.
 */
Retsly.prototype.setToken = function(token) {
  this.token = token;
  return this;
};

/**
 * Get the oauth token for current session.
 */
Retsly.prototype.getToken = function() {
  return this.token;
};

/**
 * Get the Retsly Client ID
 */
Retsly.prototype.getClient = function() {
  return this.client_id;
}

/**
 * Get the Retsly API Host
 */
Retsly.prototype.getHost = function() {
  return this.host;
};

/**
 * Get complete URL for the given resource
 */
Retsly.prototype.getURL = function (url) {
  return this.host + this.options.urlBase + '/' + url;
};

/**
 * Add an init function to the ready stack, or execute the stack
 */
Retsly.prototype.ready = function(cb) {
  if (cb) this.__init_stack.push(cb);
  else each(this.__init_stack, function(c) { if(typeof c === 'function') c(); });
  return this;
};

/**
 * API Methods
 */
Retsly.prototype.get = function(url, query, cb) {
  return this.request('get', url, query, cb);
};

Retsly.prototype.post = function(url, body, cb) {
  return this.request('post', url, body, cb);
};

Retsly.prototype.put = function(url, body, cb) {
  return this.request('put', url, body, cb);
};

Retsly.prototype.del = function(url, body, cb) {
  return this.request('delete', url, body, cb);
};

Retsly.prototype.subscribe = function(method, url, query, scb, icb) {
  var options = {};
  options.url = url;
  options.query = query;
  options.query.client_id = this.client_id;

  if(this.getToken())
    options.query.access_token = this.getToken();

  this.io.emit('subscribe', options, icb);
  this.io.on(method, scb);
  return this;
};

Retsly.prototype.request = function(method, url, query, cb) {
  // query is optional
  if (undefined === cb && 'function' == typeof query) {
    cb = query;
    query = {};
  }
  query = query || {};
  debug('%s --> %s', method, url, query);

  var options = {};
  options.query = {};
  if ('get' == method) options.query = query;
  else options.body = query;
  options.method = method;
  options.url = url;

  var token = this.getToken();
  if(token) options.query.access_token = token;
  options.query.client_id = this.client_id;

  this.io.emit('api', options, function(res) {
    delete query['client_id'];
    delete query['access_token'];
    debug(method, '<-- ', url, query);
    debug(' |---- response: ', res);
    if(typeof cb === 'function') cb(res);
  });
  return this;
};

/**
 * Returns API domain for document.domain
 */
var getDomain = Retsly.prototype.getDomain = function () {
  var domain = 'https://rets.io:443';
  if (~document.domain.indexOf('dev.rets')) domain = 'https://dev.rets.io:443';
  if (~document.domain.indexOf('stg.rets')) domain = 'https://stg.rets.io:443';
  return domain;
};

/**
 * Returns the origin for XHR CORS requests
 */
var getOrigin = Retsly.prototype.getOrigin = function () {
  return document.location.protocol
    + '//'
    + document.domain
    + (document.location.port ? (':' + document.location.port) : '');
};

/**
 * Cookie getter
 */
var getCookie = Retsly.prototype.getCookie = function(name,c,C,i) {
  c = document.cookie.split('; ');
  var cookies = {};
  for(i=c.length-1; i>=0; i--){
    C = c[i].split('=');
    cookies[C[0]] = C[1];
  }
  return cookies[name];
}

/**
 * Cookie setter
 */
var setCookie = Retsly.prototype.setCookie = function(name, value, days) {
  var expires = '';
  if (days) {
    var date = new Date();
    date.setTime(date.getTime()+(days*24*60*60*1000));
    expires = '; expires='+date.toGMTString();
  }
  document.cookie = name+'='+value+expires+'; path=/';
}

/**
 * Logs only if debug mode
 */
function debug () {
  if (Retsly.debug) console.log.apply(console, arguments);
}
