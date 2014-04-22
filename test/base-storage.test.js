/**
 * Test dependencies
 */
var util = require('util');
var should = require('should');
var BaseStorage = require('../lib/storages/base');

describe('Storage Interface', function() {
  var TestStorage = function() {
    BaseStorage.call(this);
    this.name = 'test';
  };

  util.inherits(TestStorage, BaseStorage);

  TestStorage.prototype.list = function() {};
  TestStorage.prototype.save = function() {};

  it('list() should be rewritten', function() {
    var storage = new BaseStorage();
    storage.list.should.throw();

    storage = new TestStorage();
    storage.list.should.not.throw();
  });

  it('save(data) should be rewritten', function() {
    var storage = new BaseStorage();
    storage.save.should.throw();

    storage = new TestStorage();
    storage.save.should.not.throw();
  });
});
