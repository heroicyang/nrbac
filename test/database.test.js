/**
 * Test dependencies
 */
var should = require('should');
var async = require('async');
var db = require('../lib/database');

describe('Database', function() {
  describe('Permission', function() {

    beforeEach(function(done) {
      db.Permission.create({
        action: 'create',
        resource: 'post'
      }, done);
    });

    afterEach(function() {
      db.Permission.destroy();
    });

    it('create(permission, callback)', function(done) {
      db.Permission.create({
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
      var permission = db.Permission.get('create', 'post');
      should.exist(permission);
    });

    it('list()', function() {
      var permissions = db.Permission.list();
      permissions.should.not.empty;
    });

    it('destroy()', function() {
      db.Permission.destroy();
      var permissions = db.Permission.list();
      permissions.should.empty;
    });
  });

  describe('Role', function() {

    before(function(done) {
      db.Permission.create({
        action: 'create',
        resource: 'post'
      }, done);
    });

    after(function() {
      db.Permission.destroy();
    });

    beforeEach(function(done) {
      db.Role.create({ name: 'admin' }, done);
    });

    afterEach(function() {
      db.Role.destroy();
    });

    it('create(role, callback)', function(done) {
      db.Role.create({ name: 'member' }, function(err, role) {
        should.not.exist(err);
        should.exist(role);
        role.name.should.eql('member');
        done();
      });
    });

    it('get(name)', function() {
      var role = db.Role.get('admin');
      should.exist(role);
    });

    it('list()', function() {
      var roles = db.Role.list();
      roles.should.not.empty;
    });

    it('destroy()', function() {
      db.Role.destroy();
      var roles = db.Role.list();
      roles.should.empty;
    });
  });
});
