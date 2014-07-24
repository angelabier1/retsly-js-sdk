
/**
 * Dependencies
 */
var extend = require('extend');
var io = require('socket.io');
var ajax = require('ajax');
var each = require('each');
var qs = require('querystring').stringify;

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
  this.token = token;
  this.sid = null;
  this.client_id = client_id;
  this.options = extend({urlBase: '/api/v1'}, options);

  this.__init_stack = [];
  _retsly = this;

  debug('--> Connecting to Retsly...');

  // set up socket.io connection
  this.io = io.connect(getDomain(), {
    'reconnection delay': 5000, // retry every 2 seconds
    'reconnection limit': 100, // defaults to Infinity
    'max reconnection attempts': Infinity // defaults to 10
  });

  this.io.on('connect', function() {
    debug('<-- Connected to Retsly Sockets!');
    // try to establish a session, then connect
  }.bind(this))

  // if we disconnect, try to reconnet
  this.io.on('disconnect', function() {
    if(!_retsly.io.socket.connected)
      _retsly.io.socket.reconnect();
  });

  this.io.on('reconnect_failed', function() {
    this.ready();
  }.bind(this))

  if(_attempts === 0)
    this.session(this.connect.bind(this));

  this.css();

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
}

/**
 * Set Retsly Token
 */
Retsly.token = function(token) {
  _token = token;
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
 * Initialze Retsly CSS
 */
Retsly.prototype.css = function() {

  if( document.getElementById('retsly-css-sdk') ) return;

  var css = document.createElement('link');
    css.id = 'retsly-css-sdk';
    css.media = 'all';
    css.rel = 'stylesheet';
    css.href = getDomain()+'/css/sdk'
  document.getElementsByTagName('head')[0].appendChild(css);

};

Retsly.prototype.connect = function(rsid) {

  // force multiple connections if cookie not set
  // but only attempt to connect 3 times then continue on
  if(_attempts > 2) return this.ready();

  debug('--> Requesting Retsly Session...', { attempts: _attempts });

  // on first try, express will not be able to return a sid
  this.sid = rsid;

  // on first try, express will not be able to return a sid
  if(rsid === 'false') return this.session(this.connect.bind(this));

  // session sid established, syncing cookie
  setCookie('retsly.sid', encodeURIComponent(rsid));
  debug('<-- Retsly Session Established!', { sid: this.sid });

  // tell retsly.io to listen to session
  this.io.emit('session', { sid: rsid });

  this.ready();

};

Retsly.prototype.session = function(cb) {
  cb = cb || function() {};
  _attempts++;

  ajax({
    type: 'GET',
    url: this.getURL('session'),
    data: { origin: getOrigin() },
    beforeSend: function(xhr) {
      xhr.withCredentials = true;
    },
    crossDomain : true,
    error: function (xhr,err) {
      this.ready();
      throw new Error('Could not set Retsly session');
    }.bind(this),
    success: function(res, status, xhr) {
      var sid = xhr.getResponseHeader('Retsly-Session');
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
      cb(sid);
    }
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
  options.body = {};

  options.method = method;
  options.url = url;
  options.query.client_id = this.client_id;

  if(this.getToken())
    options.query.access_token = this.getToken();

  if('get' === method || 'delete' === method) {
    options.query = extend(options.query, query);
  } else if('put' === method || 'post' === method) {
    delete query['client_id'];
    delete query['access_token'];
    options.body = query;
  }

  var endpoint = getDomain() + url + '?' + getQuery(options.query);
  var data = (options.body && typeof options.body !== 'undefined')
    ? JSON.stringify(options.body)
    : '';

  ajax({
    type: method.toUpperCase(),
    dataType: 'json',
    data: data,
    url: endpoint,
    contentType: 'application/json',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      xhr.withCredentials = true;
    },
    error: function(res, status, xhr) {
      log(method, url, query, res);
      if(typeof cb === 'function') cb(res);
    },
    success: function(res, status, xhr){
      log(method, url, query, res);
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
  return decodeURIComponent( qs(query) );
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
