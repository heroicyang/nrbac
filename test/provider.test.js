/**
 * Test dependencies
 */
var async = require('async');
var should = require('should');
var Provider = require('../lib/provider');
var MemoryStorage = require('../lib/storages/memory');

describe('Provider Constructor', function() {
  var provider = new Provider();
  var models = provider.models;

  afterEach(function() {
    models.Permission.destroy();
    models.Role.destroy();
  });

  it('use(storage)', function() {
    var memoryStorage = new MemoryStorage();
    provider.use(memoryStorage);
    provider._storage.should.be.an.instanceof(MemoryStorage);
  });

  it('list(callback)', function(done) {
    var data = {
      permissions: [{ action: 'create', resource: 'post' }],
      roles: [{ name: 'admin' }]
    };
    var memoryStorage = new MemoryStorage(data);
    provider.use(memoryStorage);

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
    var data = {
      permissions: [{ action: 'create', resource: 'post' }],
      roles: [{ name: 'admin' }]
    };
    var memoryStorage = new MemoryStorage(data);
    provider.use(memoryStorage);

    async.waterfall([
      function(next) {
        provider.sync(function(err) {
          next(err);
        });
      },
      function(next) {
        var permission = models.Permission.findOne({
          action: 'create',
          resource: 'post'
        });
        var role = models.Role.findOne({ name: 'admin' });
        should.exist(permission);
        should.exist(role);
        next(null);
      }
    ], done);
  });
});
