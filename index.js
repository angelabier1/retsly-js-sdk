/**
 * Dependencies
 */
var extend = require('extend');
var io = require('socket.io-client');
var ajax = require('ajax');
var each = require('each');
var qs = require('querystring').stringify;
var store = require('cookie');
var emitter = require('emitter');

module.exports = Retsly;

var _retsly, _client, _opts, _token, _attempts = 0;

/**
 * Core SDK
 */
function Retsly (client_id, token, options) {

  if (!token)
    throw new Error('You must provide a browser token - ie: new Retsly(\'client_id\', \'token\');');

  if (!client_id)
    throw new Error('You must provide a client_id - ie: new Retsly(\'client_id\', \'token\');');

  var domain = this.getDomain();

  this.host = domain;
  this.sid = null;
  this.user_id = null;
  this.token = _token = token;
  this.client_id = _client = client_id;
  this.options = extend({urlBase: '/api/v1'}, options);
  this.__init_stack = [];

  _retsly = this;

  debug('--> Connecting to Retsly...');


  if(_attempts === 0)
    this.session(this.connect.bind(this));

  // css causes (derp) session issues
  // TODO: @slajax fix
  // this.css();

  emitter(this);

}

Retsly.prototype.doSockets = function() {

  // set up socket.io connection
  this.io = io.connect(getDomain(), {
    'reconnectionDelay': 5000, // retry every 2 seconds
    //'reconnection limit': 100, // defaults to Infinity
    'timeout': 10000 // defaults to 10
  });


  this.io.on('connection', function(socket) {
    debug('<-- Connected to Retsly Sockets!');
    // try to establish a session, then connect
  }.bind(this))

  // if we disconnect, try to reconnet
  this.io.on('connect_error', function() {
    debug('connect error');
  });

  this.io.on('reconnect_error', function() {
    debug('reconnect error');
  });

  this.io.on('reconnect_failed', function() {
    debug('reconnect failed')
  }.bind(this))

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
Retsly.create = function create (client, token, opts) {
  var s = !arguments.length;
  token = token || _token;
  client = client || _client;
  opts = opts || _opts;
  if (!s && !client) throw new Error('call Retsly.create() with client id and options');
  return (s && _retsly) ? _retsly : (_retsly = new Retsly(client, token, opts));
}

/**
 * Set the Retsly Client ID
 */
Retsly.client = function (id) {
  _client = id;
  return Retsly;
};

/**
 * Set Retsly Token
 */
Retsly.token = function(token) {
  Retsly.token = _token = token;
  return Retsly;
};

/**
 * Validate session state
 */
Retsly.prototype.validateSession = function(status) {
  switch (status.toString()) {
    case '401':
      debug('--> Session expired!');
      this.setUserToken(null);
      this.emit('SessionExpired');
  }
  return;
};

/*
 * Set Retsly Options
 */
Retsly.options = function (opts) {
  _opts = opts;
  return Retsly;
};

/**
 * Initialze Retsly CSS
 */
Retsly.prototype.css = function() {

  if( document.getElementById('retsly-css-sdk') ) return;

  var css = document.createElement('link');
  css.id = 'retsly-css-sdk';
  css.media = 'all';
  css.rel = 'stylesheet';
  css.href = getDomain()+'/sdk/sdk.css'
  document.getElementsByTagName('head')[0].appendChild(css);

};

Retsly.socketApiCallbacks =  {};

Retsly.prototype.connect = function(rsid) {

  // force multiple connections if cookie not set
  // but only attempt to connect 3 times then continue on
  if(_attempts > 2) return this.ready();

  debug('--> Requesting Retsly Session... attempts: '+_attempts);

  // on first try, express will not be able to return a sid
  this.sid = decodeURIComponent(rsid);

  // on first try, express will not be able to return a sid
  if(!this.sid || this.sid === 'false') return this.session(this.connect.bind(this));

  setCookie('retsly.sid', this.sid, 10800000); // 3hrs
  this.doSockets();

  // tell rets.io to listen to sid for this client
  this.io.emit('session', { sid: this.sid });

  // listen for rets.io to return sid confirmation
  this.io.on('sessionResponse', function(data){
    // session sid established, syncing cookie
    (data.bundle === this.sid)
        ? debug('<-- Retsly Session Established! ', this.sid)
        : debug('XXX - Sessions do not match', data.bundle);

    this.ready();
  }.bind(this));

  this.io.on('api', function(response){
    var apiCallback = Retsly.socketApiCallbacks[response.url];
    if(apiCallback && response.status === 200) apiCallback(null,response.bundle);
    else if(apiCallback) apiCallback(response);
    else throw new Error('Retsly Socket route not defined');
  });

};

/**
 * Allows you to request data over sockets
 */
Retsly.prototype.apiRoute = function apiRoute(url,method,args,cb) {
  var data = {'url':url,'method':method,'args':args};
  Retsly.socketApiCallbacks[url] = cb;
  debug('socket api call : ', data);
  this.io.emit('api', data);
};

Retsly.prototype.session = function(cb) {
  cb = cb || function() {};
  _attempts++;

  var data = { }

  /*
   *  if (window.XDomainRequest)
   *    data.session_id = this.getCookie('retsly.sid');
   */
  data.origin = getOrigin();

  ajax({
    type: 'GET',
    url: this.getURL('session'),
    data: data,
    beforeSend: function(xhr) {
      xhr.withCredentials = true;
      if (window.XMLHttpRequest && !window.XDomainRequest)
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    },
    crossDomain : true,
    error: function (xhr,err) {
      throw new Error('Could not set Retsly session');
    }.bind(this),
    success: function(res, status, xhr) {
      var sid;
      (xhr.getResponseHeader)
          ? sid = xhr.getResponseHeader('Retsly-Session')
          : sid = JSON.parse(res).bundle;

      cb(sid);
    }
  });

};

/**
 * Log out a Retsly session;
 */
Retsly.prototype.logout = function(cb) {
  cb = cb || function() {};
  ajax({
    type: 'DELETE',
    url: this.getURL('session')+'?origin='+getOrigin(),
    beforeSend: function(xhr) {
      xhr.withCredentials = true;
    },
    crossDomain : true,
    error: function(error) {
      throw new Error('Could not delete Retsly session');
    },
    success: function(res, status, xhr) {
      var sid = xhr.getResponseHeader('Retsly-Session');
      this.setUserToken(null);
      cb(sid);
    }.bind(this)
  });
  return this;
};


/**
 * Set an oauth token for extended privileges on current session.
 */
Retsly.prototype.setToken = Retsly.prototype.setAppToken = function(token) {
  this.token = _token = token;
  return this;
};

/**
 * Get the oauth token for current session.
 */
Retsly.prototype.getToken = Retsly.prototype.getAppToken = function() {
  var token = this.token;
  return typeof token === 'string' ? token : false;
};

/**
 * Set an oauth token for extended privileges on current session.
 */
Retsly.prototype.setUserToken = function(token) {
  this.token = token;
  store('retsly.uid', token, { path: '/' });
  return this;
};

/**
 * Get the oauth token for current session.
 */
Retsly.prototype.getUserToken = function() {
  var token = store('retsly.uid');
  return typeof token === 'string' ? token : false;
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
  if(!cb) this.__init_stack = []; //clear stack
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

Retsly.prototype.request = function(method, url, query, cb) {
  var self = this;

  // query is optional
  if (undefined === cb && 'function' == typeof query) {
    cb = query;
    query = {};
  }

  query = query || {};
  var options = {};
  options.query = {};
  options.body = {};

  options.method = method;
  options.url = url;
  options.query.client_id = this.client_id;

  if(this.getUserToken())
    options.query.access_token = this.getUserToken();
  else if(this.getAppToken())
    options.query.access_token = this.getAppToken();
  else return cb({ success: false, status: 401, bundle: 'No token set'})

  if('get' === method || 'delete' === method) {
    options.query = extend(options.query, query);
  } else if('put' === method || 'post' === method) {
    delete query['client_id'];
    delete query['access_token'];
    options.body = query;
  }

  var endpoint = getDomain() + url + '?' + getQuery(options.query);
  var data = (method !== 'get' && options.body && typeof options.body !== 'undefined')
      ? JSON.stringify(options.body)
      : '';

  debug('%s --> %s', method, url, query);

  ajax({
    type: method.toUpperCase(),
    dataType: 'json',
    data: data,
    url: endpoint,
    contentType: 'application/json',
    beforeSend: function(xhr) {
      xhr.withCredentials = true;
      if (window.XMLHttpRequest && !window.XDomainRequest)
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    },
    error: function(res, status, xhr) {
      log(method, url, query, res);
      self.validateSession(res.status);
      if(typeof cb === 'function') cb(res);
    }.bind(this),
    success: function(res, status, xhr){
      log(method, url, query, res);
      self.validateSession(res.status);
      if(typeof cb === 'function') cb(res);
    }
  });

  function log(method, url, query, res) {
    delete query['client_id'];
    delete query['access_token'];
    debug(method, '<-- ', url, query);
    debug(' |---- response: ', res);
  }

  return this;
};


/**
 * Returns a Retsly API compatible query string from a JSON object
 */
var getQuery = Retsly.prototype.getQuery = function(query) {
  var params = qs(query);
  if(!params.length) return '';
  else return decodeURIComponent(params);
};

/**
 * Returns API domain for document.domain
 */
var getDomain = Retsly.prototype.getDomain = function () {
  var domain = 'https://rets.io:443';
  if (~document.domain.indexOf('dev.rets')) domain = 'https://dev.rets.io:443';
  if (~document.domain.indexOf('stg.rets')) domain = 'https://stg.rets.io:443';
  if (~document.domain.indexOf('ci.rets')) domain = 'https://ci.rets.io:443';
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
var setCookie = Retsly.prototype.setCookie = function(name, value, ms) {
  var expires = '';
  if (ms) {
    var date = new Date();
    date.setTime(date.getTime()+(ms));
    expires = '; expires='+date.toGMTString();
  }
  document.cookie = name+'='+value+expires+'; path=/';
};

/**
 * Logs only if debug mode
 */
function debug () {
  if (Retsly.debug) Function.prototype.apply.call( console.log, console, arguments );
}