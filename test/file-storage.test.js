/**
 * Test dependencies
 */
var fs = require('fs');
var should = require('should');
var FileStorage = require('../lib/storages/file');

describe('FileStorage Constructor', function() {
  var fileStorage = new FileStorage(__dirname + '/test.json');

  before(function(done) {
    var data = {
      permissions: [{ action: 'create', resource: 'post' }],
      roles: [{ name: 'admin' }]
    };
    fileStorage.save(data, done);
  });

  it('should have the correct type set', function() {
    should.exist(fileStorage);
    fileStorage.type.should.eql('file');
  });

  it('list(callback)', function(done) {
    fileStorage.list(function(err, data) {
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
    fileStorage.save(data, function(err) {
      should.not.exist(err);
      fileStorage.list(function(err, result) {
        result.should.eql(data);
        done();
      });
    });
  });

  after(function(done) {
    fs.unlink(__dirname + '/test.json', done);
  });
});
