/**
 * Test dependencies
 */
var should = require('should');
var nrbac = require('../lib');

describe('Top-level include for the nrbac module', function() {

  it('should have the correct submodules set', function() {
    should.exist(nrbac);
    should.exist(nrbac.Permission);
    should.exist(nrbac.Role);
    should.exist(nrbac.Provider);
    should.exist(nrbac.PermissionModel);
    should.exist(nrbac.RoleModel);
    should.exist(nrbac.FileStorage);
    should.exist(nrbac.MongoDBStorage);
  });

  describe('Permission', function() {

    beforeEach(function(done) {
      nrbac.Permission.create({
        action: 'create',
        resource: 'post'
      }, done);
    });

    afterEach(function() {
      nrbac.Permission.destroy();
    });

    it('create(permission, callback)', function(done) {
      nrbac.Permission.create({
        action: 'update',
        resource: 'post'
      }, function(err, permission) {
        should.not.exist(err);
        should.exist(permission);
        permission.action.should.eql('update');
        permission.resource.should.eql('post');
        done();
      });
    });

    it('get(action, resource)', function() {
      var permission = nrbac.Permission.get('create', 'post');
      should.exist(permission);
    });

    it('list()', function() {
      var permissions = nrbac.Permission.list();
      permissions.should.not.be.empty;
    });

    it('destroy()', function() {
      nrbac.Permission.destroy();
      var permissions = nrbac.Permission.list();
      permissions.should.be.empty;
    });
  });

  describe('Role', function() {

    before(function(done) {
      nrbac.Permission.create({
        action: 'create',
        resource: 'post'
      }, done);
    });

    after(function() {
      nrbac.Permission.destroy();
    });

    beforeEach(function(done) {
      nrbac.Role.create({ name: 'admin' }, done);
    });

    afterEach(function() {
      nrbac.Role.destroy();
    });

    it('create(role, callback)', function(done) {
      nrbac.Role.create({ name: 'member' }, function(err, role) {
        should.not.exist(err);
        should.exist(role);
        role.name.should.eql('member');
        done();
      });
    });

    it('get(name)', function() {
      var role = nrbac.Role.get('admin');
      should.exist(role);
    });

    it('list()', function() {
      var roles = nrbac.Role.list();
      roles.should.not.be.empty;
    });

    it('destroy()', function() {
      nrbac.Role.destroy();
      var roles = nrbac.Role.list();
      roles.should.be.empty;
    });
  });
});
