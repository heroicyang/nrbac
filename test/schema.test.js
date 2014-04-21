/**
 * Test dependencies
 */
var should = require('should');
var async = require('async');
var Database = require('warehouse');
var schema = require('../lib/schema');

var db = new Database();

describe('RBAC Data Schema', function() {
  it('should register correct hooks', function() {
    schema.registerHooks(db);
    schema.PermissionSchema.pres.save.should.have.length(2);
    schema.RoleSchema.pres.save.should.have.length(2);
  });

  it('should register correct methods', function() {
    schema.registerMethods();
    schema.PermissionSchema.statics.create.should.be.an.instanceof(Function);
    schema.RoleSchema.statics.create.should.be.an.instanceof(Function);
    schema.RoleSchema.methods.grant.should.be.an.instanceof(Function);
    schema.RoleSchema.methods.can.should.be.an.instanceof(Function);
  });

  describe('Using Model compiled from Schema', function() {
    var Permission, Role;

    beforeEach(function() {
      schema.registerHooks(db);
      schema.registerMethods();
      Permission = db.model('Permission', schema.PermissionSchema);
      Role = db.model('Role', schema.RoleSchema);
    });

    afterEach(function() {
      db._restore({
        Permission: [],
        Role: []
      });
    });

    it('should check params when save the permission', function(done) {
      Permission.create({
        action: '&%adasd123',
        resource: 'post'
      }, function(err) {
        should.exist(err);
        done();
      });
    });

    it('permission action and resource should unique', function(done) {
      async.series([
        function(next) {
          Permission.create({
            action: 'create',
            resource: 'post'
          }, next);
        },
        function(next) {
          Permission.create({
            action: '&%adasd123',
            resource: 'post'
          }, function(err) {
            should.exist(err);
            next(null);
          });
        }
      ], done);
    });

    it('should check params when save the role', function(done) {
      Role.create({
        name: '&%adasd123'
      }, function(err) {
        should.exist(err);
        done();
      });
    });

    it('role name should unique', function(done) {
      async.series([
        function(next) {
          Role.create({
            name: 'admin'
          }, next);
        },
        function(next) {
          Role.create({
            name: 'admin'
          }, function(err) {
            should.exist(err);
            next(null);
          });
        }
      ], done);
    });

    it('should create correct permission', function(done) {
      Permission.create({
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

    it('should create correct role', function(done) {
      Role.create({
        name: 'superadmin'
      }, function(err, role) {
        should.not.exist(err);
        should.exist(role);
        role.name.should.eql('superadmin');
        done();
      });
    });

    it('should grant correct permission to role', function(done) {
      async.auto({
        permission: function(next) {
          Permission.create({
            action: 'read',
            resource: 'post'
          }, next);
        },
        role: function(next) {
          Role.create({
            name: 'member'
          }, next);
        },
        roleGranted: ['permission', 'role', function(next, result) {
          result.role.grant(result.permission, next);
        }]
      }, function(err, results) {
        should.not.exist(err);

        var role = results.roleGranted;
        role.permissions.should.have.length(1);
        done();
      });
    });

    it('check permission', function(done) {
      async.auto({
        permission: function(next) {
          Permission.create({
            action: 'read',
            resource: 'post'
          }, next);
        },
        role: function(next) {
          Role.create({
            name: 'member'
          }, next);
        },
        roleGranted: ['permission', 'role', function(next, result) {
          result.role.grant(result.permission, next);
        }]
      }, function(err, results) {
        should.not.exist(err);

        var role = results.roleGranted;
        role.can('read', 'post').should.be.ok;
        role.can('create', 'post').should.not.be.ok;
        done();
      });
    });
  });
});
