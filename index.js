
/**
 * Dependencies
 */
var extend = require('extend');
var ajax = require('ajax');
var each = require('each');
var io = window.io;

var PROTOCOL = 'https://';
var DOMAIN = getDomain();

/**
 * Core SDK
 */
module.exports = Retsly;

/**
 * Constructor with a internal scope reference to _this
 * _this is used for Backbone methods which aren't part of the prototype
 */
var _this;
function Retsly (client_id, options) {
  if (!client_id)
    throw new Error('You must provide a client_id - ie: new Retsly(\'xxx\');');

  this.client_id = client_id;
  this.token = null;
  this.options = extend({urlBase: '/api/v1'}, options);
  this.host = DOMAIN;
  this.io = io.connect(PROTOCOL+DOMAIN, {'sync disconnect on unload':false});

  this.__init_stack = [];
  this.init();
  _this = this;
}

/**
 * debug messages print if true
 */
Retsly.debug = false;

/**
 * Get complete URL for the given resource
 */
Retsly.prototype.getURL = function (url) {
  return PROTOCOL + DOMAIN + this.options.urlBase + '/' + url;
};

Retsly.prototype.init = function() {
  var self = this;
  debug('--> Loading Retsly SDK...');
  // <!-- Make sure you ask @slajax before changing this
  ajax({
    type: 'POST',
    data: { origin: getOrigin(), action: 'set' },
    url: this.getURL('session'),
    xhrFields: { withCredentials: true },
    beforeSend: function(xhr) {
      xhr.withCredentials = true;
    },
    success: function(sid) {
      self.io.emit('authorize', { sid: sid }, function(data) {
        if(typeof data.bundle === 'string') setCookie('retsly.sid', data.bundle);
        debug('<-- Retsly SDK Loaded!');
        self.ready();
      });
    }
  });
  // Make sure you ask @slajax before changing this -->
};

//TODO kyle: Make this restful. It's way too fucken late right now.
Retsly.prototype.logout = function(cb) {
  var success = cb || function() {};
  ajax({
    type: 'POST',
    xhrFields: { withCredentials: true },
    beforeSend: function(xhr) {
      xhr.withCredentials = true;
    },
    data: { origin: getOrigin(), action: 'del' },
    url: this.getURL('session'),
    error: function (error) { throw new Error(error); },
    success: success
  });
};

// Set an oauth token for extended privileges.
Retsly.prototype.setToken = function(token) {
  this.token = token;
};

Retsly.prototype.getToken = function() {
  return this.token;
};

Retsly.prototype.ready = function(cb) {
  if (cb) this.__init_stack.push(cb);
  else each(this.__init_stack, function(c) { if(typeof c === 'function') c(); });
  return this;
};

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
  return this.io.on(method, scb);
};

Retsly.prototype.request = function(method, url, query, cb) {
  // query is optional
  if (undefined === cb && 'function' == typeof query) {
    cb = query;
    query = {};
  }
  var options = {};
  options.method = method;
  options.query = query || {};
  options.url = url;
  options.query.access_token = this.getToken();
  options.query.client_id = this.client_id;
  this.io.emit('api', options, cb);
  return this;
};


/**
 * Cookie utils
 */
function getCookie (name,c,C,i) {
  c = document.cookie.split('; ');
  var cookies = {};
  for(i=c.length-1; i>=0; i--){
    C = c[i].split('=');
    cookies[C[0]] = C[1];
  }
  return cookies[name];
}

function setCookie (name, value, days) {
  var expires = '';
  if (days) {
    var date = new Date();
    date.setTime(date.getTime()+(days*24*60*60*1000));
    expires = '; expires='+date.toGMTString();
  }
  document.cookie = name+'='+value+expires+'; path=/';
}

/**
 * Returns API domain for document.domain
 */
function getDomain () {
  var domain = 'rets.io:443';
  if (~document.domain.indexOf('dev.rets.ly')) domain = 'dev.rets.io:443';
  if (~document.domain.indexOf('stg.rets.ly')) domain = 'stg.rets.io:443';
  return domain;
}

function getOrigin () {
  return document.location.protocol
    + '//'
    + document.domain
    + (80 == document.location.port ? '' : (':' + document.location.port));
}

/**
 * Logs only if debug mode
 */
function debug () {
  if (Retsly.debug) console.log.apply(console, arguments);
}
