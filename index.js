
/**
 * Dependencies
 */
var extend = require('underscore').extend;
var each = require('underscore').each;
var io = require('socket.io-client');
var ajax = require('ajax');

var PROTOCOL = 'https://';
var DOMAIN = 'rets.ly';

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
  if(!client_id)
    throw new Error('You must provide a client_id - ie: new Retsly(\'xxx\');');

  this.client_id = client_id, this.token = null;
  this.options = _.extend({ urlBase: '/api/v1', debug: false }, options);
  this.host = (document.domain.indexOf('dev.rets.ly') > -1) ? 'dev.rets.io:443' : 'rets.io:443';
  this.io = io.connect(PROTOCOL+this.host+'/', {'sync disconnect on unload':false});
  this.init_stack = [];
  this.init();
  _this = this;
  return this;
};

Retsly.prototype.init = function() {

  var self = this;

  if($(document.body).hasClass('retsly')) return this.ready();
  if(this.options.debug) console.log('--> Loading Retsly SDK...');

  var css = $('<link>').attr({
    media: 'all', rel: 'stylesheet',
    href: PROTOCOL+self.host+'/css/sdk'
  });

  css.load(function() {
    self.get('/api/v1/templates', {}, function(res) {
      if(self.options.debug) console.log('<-- Retsly SDK Loaded!');
      if(res.success) {
        $(document.body).addClass('retsly').append('<div id="retsly-templates" />');
        $('#retsly-templates').append(res.bundle);

        // <!-- Make sure you ask @slajax before changing this
        $.ajax({
          type: 'POST', xhrFields: { withCredentials: true },
          data: { origin: document.location.protocol+'//'+document.domain, action: 'set' },
          url: PROTOCOL+self.host+'/api/v1/session?origin='+document.domain,
          success: function(sid) {
            self.io.emit('authorize', { sid: sid }, function(data) {
              if(typeof data.bundle === 'string') self.setCookie('retsly.sid', data.bundle);
              self.ready();
            });
          }
        });
        // Make sure you ask @slajax before changing this -->
      }
    });

  });

  css.appendTo('head');

};

//TODO kyle: Make this restful. It's way too fucken late right now.
Retsly.prototype.logout = function(cb) {
  var success = cb || function() {};
  $.ajax({
    type: 'POST', xhrFields: { withCredentials: true },
    data: { origin: document.location.protocol+'//'+document.domain, action: 'del' },
    url: PROTOCOL+this.host+'/api/v1/session',
    error: function(error) { throw new Error(error); },
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
  if(cb) this.init_stack.push(cb);
  else _.each(this.init_stack, function(c) { if(typeof c === 'function') c(); });
};

Retsly.prototype.request = function(url, options, cb) {
  this.io.emit('api', _.extend({ url: url }, options), cb);
};

Retsly.prototype.get = function(url, query, cb) {

  var options = {};
  options.method = 'get';
  options.query = typeof query === "object" ? query : {};
  options.query.client_id = this.client_id;

  if(this.getToken())
    options.query.access_token = this.getToken();

  return this.request(url, options, cb);
};

Retsly.prototype.post = function(url, body, cb) {
  var options = {};
  options.method = 'post';
  options.body =  typeof body === "object" ? body : {};
  options.query = { client_id: this.client_id };

  if(this.getToken())
    options.query.access_token = this.getToken();

  return this.request(url, options, cb);
};

Retsly.prototype.put = function(url, body, cb) {
  var options = {};
  options.method = 'put';
  options.body =  typeof body === "object" ? body : {};
  options.query = { client_id: this.client_id };

   if(this.getToken())
    options.query.access_token = this.getToken();

  return this.request(url, options, cb);
};

Retsly.prototype.del = function(url, body, cb) {
  var options = {};
  options.method = 'delete';
  options.body =  typeof body === "object" ? body : {};
  options.query = { client_id: this.client_id };

  if(this.getToken())
    options.query.access_token = this.getToken();

  return this.request(url, options, cb);
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

var cookies;
Retsly.prototype.getCookie = function (name,c,C,i){
  c = document.cookie.split('; ');
  cookies = {};
  for(i=c.length-1; i>=0; i--){
    C = c[i].split('=');
    cookies[C[0]] = C[1];
  }
  return cookies[name];
};

Retsly.prototype.setCookie = function (name,value,days) {
  if (days) {
    var date = new Date();
    date.setTime(date.getTime()+(days*24*60*60*1000));
    var expires = "; expires="+date.toGMTString();
  }
  else var expires = "";
  document.cookie = name+"="+value+expires+"; path=/";
};
