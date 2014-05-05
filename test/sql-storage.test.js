/**
 * Test dependencies
 */
var should = require('should');
var SqlStorage = require('../lib/storages/sql');

describe('MongoStorage Constructor', function() {
  var sqlStorage = new SqlStorage({
    client: 'mysql',
    connection: {
      host: '127.0.0.1',
      user: 'heroic',
      password: '111111',
      database: 'nrbac',
      charset: 'UTF8_GENERAL_CI'
    }
  });

  before(function(done) {
    var data = {
      permissions: [{ action: 'create', resource: 'post', _id: 'a123bc' }],
      roles: [{ name: 'admin', _id: 'asd123' }]
    };
    sqlStorage.save(data, done);
  });

  it('should have the correct type set', function() {
    should.exist(sqlStorage);
    sqlStorage.type.should.eql('sql');
  });

  it('list(callback)', function(done) {
    sqlStorage.list(function(err, data) {
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
    sqlStorage.save(data, function(err) {
      should.not.exist(err);
      sqlStorage.list(function(err, result) {
        should.exist(result);
        result.permissions.should.have.length(2);
        result.roles.should.have.length(1);
        result.roles[0].name.should.eql('root');
        done();
      });
    });
  });

  after(function(done) {
    sqlStorage.clear(done);
  });
});
