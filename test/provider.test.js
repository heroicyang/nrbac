/**
 * Test dependencies
 */
var async = require('async');
var should = require('should');
var Provider = require('../lib/provider');
var MemoryStorage = require('../lib/storages/memory');

var db = Provider.db;

describe('Provider Constructor', function() {
  afterEach(function() {
    db.Permission.destroy();
    db.Role.destroy();
  });

  it('should set correct submodule', function() {
    should.exist(Provider.db);
    should.exist(Provider.db.Permission);
    should.exist(Provider.db.Role);
  });

  it('use(storage)', function() {
    var provider = new Provider();
    var memoryStorage = new MemoryStorage();
    provider.use(memoryStorage);
    provider._storage.should.be.an.instanceof(MemoryStorage);
  });

  it('list(callback)', function(done) {
    var provider = new Provider();
    var data = {
      Permission: [{ action: 'create', resource: 'post' }],
      Role: [{ name: 'admin' }]
    };
    var memoryStorage = new MemoryStorage(data);
    provider.use(memoryStorage);

    provider.list(function(err, result) {
      if (err) {
        return done(err);
      }

      should.exist(result);
      result.Permission.should.have.length(1);
      result.Role.should.have.length(1);
      done();
    });
  });

  it('sync(callback)', function(done) {
    var provider = new Provider();
    var data = {
      Permission: [{ action: 'create', resource: 'post' }],
      Role: [{ name: 'admin' }]
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
        var permission = db.Permission.findOne({
          action: 'create',
          resource: 'post'
        });
        var role = db.Role.findOne({
          name: 'admin'
        });
        should.exist(permission);
        should.exist(role);
        next(null);
      }
    ], done);
  });
});
