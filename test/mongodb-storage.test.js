/**
 * Test dependencies
 */
var should = require('should');
var MongoDBStorage = require('../lib/storages/mongodb');

describe('MongoDBStorage Constructor', function() {
  var mongodbStorage = new MongoDBStorage({
    db: 'nrbac'
  });

  before(function(done) {
    var data = {
      permissions: [{ action: 'create', resource: 'post' }],
      roles: [{ name: 'admin' }]
    };
    mongodbStorage.save(data, done);
  });

  it('should have the correct name set', function() {
    should.exist(mongodbStorage);
    mongodbStorage.name.should.eql('mongodb');
  });

  it('list(callback)', function(done) {
    mongodbStorage.list(function(err, data) {
      should.not.exist(err);
      should.exist(data);
      data.permissions.should.have.length(1);
      data.roles.should.have.length(1);
      data.permissions[0].action.should.eql('create');
      data.permissions[0].resource.should.eql('post');
      data.roles[0].name.should.eql('admin');
      done();
    });
  });

  it('save(data, callback)', function(done) {
    var data = {
      permissions: [{ action: 'update', resource: 'post' }],
      roles: [{ name: 'admin' }]
    };
    mongodbStorage.save(data, function(err) {
      should.not.exist(err);
      mongodbStorage.list(function(err, result) {
        should.exist(result);
        result.permissions.should.have.length(1);
        result.roles.should.have.length(1);
        result.permissions[0].action.should.eql('update');
        result.permissions[0].resource.should.eql('post');
        result.roles[0].name.should.eql('admin');
        done();
      });
    });
  });

  after(function(done) {
    mongodbStorage.clear(done);
  });
});
