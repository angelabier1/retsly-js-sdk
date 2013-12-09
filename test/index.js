
/**
 * Dependencies
 */
var Retsly = require('retsly-js-sdk');
var assert = require('assert');
var noop = function () {};

// don't log debugs
Retsly.debug = false;
// TODO luke temp maybe
Retsly.getDomain = function () { return 'http://stg.rets.io:4001' };
// Retsly.getOrigin = function () { return document.location.origin };

/**
 * Core API
 */
suite('Retsly');

test('is a constructor', function () {
  assert('function' == typeof Retsly);
});

test('expects two arguments', function () {
  assert(2 == Retsly.length);
  assert.throws(function(){new Retsly()});
  assert.ok(new Retsly('test'));
});

test('has public options property', function () {
  var r = new Retsly('test', {foo: 'bar'});
  assert('bar' == r.options.foo);
});

test('has a socket.io connection', function () {
  var r = new Retsly('test');
  assert(r.io);
});

Retsly = require('retsly-js-sdk');

suite('Retsly.create()');

test('setup is chainable', function () {
  Retsly
    .client('test')
    .options({foo:true})
    .create();
});

test('returns same instance each call', function () {
  var r = Retsly.create();
  var s = Retsly.create();

  assert(r instanceof Retsly);
  assert(s instanceof Retsly);
  assert.equal(r, s);
});

test('pass new args to replace', function () {
  var r = Retsly.create();
  var s = Retsly.create('foo', {foo:false});
  var t = Retsly.create();

  assert.notEqual(r, s);
  assert.equal(s, t);
});


suite('Retsly#getURL()');

test('builds URLs from fragments', function () {
  var r = new Retsly('test');
  assert(Retsly.getDomain()+'/api/v1/test' == r.getURL('test'));
});


suite('Retsly#ready()');

test('calls all functions passed', function (done) {
  var i = 0;
  var fn = function () { i++; if (2==i) done() };
  var r = new Retsly('test');
  r.ready(fn)
   .ready(fn);
});

test('is chainable', function () {
  var r = new Retsly('test')
    .ready(noop)
    .ready(noop);
  assert(r instanceof Retsly);
});



suite('Retsly#request()');

test('calls back with a response', function (done) {
  var r = new Retsly('test').ready(ready);

  function ready () {
    r.request('get', '/api/v1/listings/sandicor.json', cb);
  }

  function cb (res) {
    assert(401 == res.status);
    assert(false === res.success);
    done();
  }
});
 

test('is chainable', function () {
  var r = new Retsly('test')
    .get('test', noop)
    .post('test2', noop);
  assert(r instanceof Retsly);
});


suite('Retsly#logout()');

test('is chainable', function () {
  var r = new Retsly('test')
    .logout(noop);
  assert(r instanceof Retsly);
});


test('destroys session and calls cb', function (done) {
  var r = new Retsly('test').ready(ready);
  function ready () {
    r.logout(function () {
      assert(true);
      done();
    });
  }
});
