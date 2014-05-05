/**
 * Test dependencies
 */
var should = require('should');
var MongoStorage = require('../lib/storages/mongo');

describe('MongoStorage Constructor', function() {
  var mongodbStorage = new MongoStorage({
    db: 'nrbac'
  });

  before(function(done) {
    var data = {
      permissions: [{ action: 'create', resource: 'post', _id: 'a123bc' }],
      roles: [{ name: 'admin', _id: 'asd123' }]
    };
    mongodbStorage.save(data, done);
  });

  it('should have the correct type set', function() {
    should.exist(mongodbStorage);
    mongodbStorage.type.should.eql('mongodb');
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
      permissions: [{ action: 'update', resource: 'post', _id: 'a234bc' }],
      roles: [{ name: 'root', _id: 'asd123' }]
    };
    mongodbStorage.save(data, function(err) {
      should.not.exist(err);
      mongodbStorage.list(function(err, result) {
        should.exist(result);
        result.permissions.should.have.length(2);
        result.roles.should.have.length(1);
        result.roles[0].name.should.eql('root');
        done();
      });
    });
  });

  after(function(done) {
    mongodbStorage.clear(done);
  });
});
