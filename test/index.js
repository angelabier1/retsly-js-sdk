
/**
 * Dependencies
 */
var Retsly = require('retsly-js-sdk');
var assert = require('assert');


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
