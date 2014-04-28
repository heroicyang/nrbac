/**
 * Test dependencies
 */
var async = require('async');
var should = require('should');
var model = require('../lib/model');
var Provider = require('../lib/provider');
var MemoryStorage = require('../lib/storages/memory');

describe('Provider Constructor', function() {
  var provider = new Provider();

  beforeEach(function(done) {
    var memoryStorage = new MemoryStorage();
    provider.use(memoryStorage);

    async.parallel([
      function(next) {
        model.Permission.create({
          action: 'create',
          resource: 'post'
        }, next);
      },
      function(next) {
        model.Role.create({
          name: 'admin'
        }, next);
      }
    ], done);
  });

  afterEach(function() {
    model.Permission.destroy();
    model.Role.destroy();
  });

  it('use(storage)', function() {
    var memoryStorage = new MemoryStorage();
    provider.use(memoryStorage);
    provider._storage.should.be.an.instanceof(MemoryStorage);
  });

  it('list(callback)', function(done) {
    provider.list(function(err, result) {
      if (err) {
        return done(err);
      }

      should.exist(result);
      result.permissions.should.have.length(1);
      result.roles.should.have.length(1);
      done();
    });
  });

  it('sync(callback)', function(done) {
    async.waterfall([
      function(next) {
        provider.sync(function(err) {
          next(err);
        });
      },
      function(next) {
        var permission = model.Permission.findOne({
          action: 'create',
          resource: 'post'
        });
        var role = model.Role.findOne({ name: 'admin' });
        should.exist(permission);
        should.exist(role);
        next(null);
      }
    ], done);
  });
});
