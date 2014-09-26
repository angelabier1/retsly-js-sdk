
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

/**
 * Core API
 */
suite('Retsly');

test('is a constructor', function () {
  assert('function' == typeof Retsly);
});

test('expects three arguments', function () {
  assert(3 == Retsly.length);
  assert.throws(function(){new Retsly()});
  assert.ok(new Retsly('test', 'test'));
});

test('has public options property', function () {
  var r = new Retsly('test', 'test', {foo: 'bar'});
  assert('bar' == r.options.foo);
});

test('has a socket.io connection', function () {
  var r = new Retsly('test', 'test');
  assert(r.io);
});

Retsly = require('retsly-js-sdk');

suite('Retsly.create()');

test('setup is chainable', function () {
  Retsly
    .client('test')
    .token('test')
    .options({foo:true})
    .create();
});

test('returns original instance', function () {
  var r1 = new Retsly('original', 'test');
  var r2 = Retsly.create();
  assert(r2.getClient() === 'original');
  assert(r2 === r1);
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
  var s = Retsly.create('foo', 'test', {foo:false});
  var t = Retsly.create();

  assert.notEqual(r, s);
  assert.equal(s, t);
});


suite('Retsly#getURL()');

test('builds URLs from fragments', function () {
  var r = new Retsly('test','test');
  assert(r.getDomain()+'/api/v1/test' == r.getURL('test'));
});


suite('Retsly#ready()');

test('calls all functions passed', function (done) {
  var i = 0;
  var fn = function () { i++; if (2==i) done() };
  var r = new Retsly('test','test');
  r.ready(fn)
   .ready(fn)
   .ready();
});

test('is chainable', function () {
  var r = new Retsly('test','test')
    .ready(noop)
    .ready(noop);
  assert(r instanceof Retsly);
});

test('is chainable', function () {
  var r = new Retsly('test','test')
    .get('test.html', noop)
    .post('test.html', noop);
  assert(r instanceof Retsly);
});


suite('Retsly#logout()');

test('is chainable', function () {
  var r = new Retsly('test','test')
    .logout(noop);
  assert(r instanceof Retsly);
});

