/**
 * Test dependencies
 */
var should = require('should');
var async = require('async');
var sinon = require('sinon');
var Database = require('warehouse');
var schema = require('../lib/schema');

var db = new Database();

describe('Data Schema', function() {
  var provider = {
    _db: db
  };
  var models = schema.model(provider);
  var Permission = models.Permission;
  var Role = models.Role;

  afterEach(function() {
    Permission.destroy();
    Role.destroy();
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

  it('permission action and resource should be unique', function(done) {
    async.series([
      function(next) {
        Permission.create({
          action: 'create',
          resource: 'post'
        }, next);
      },
      function(next) {
        Permission.create({
          action: 'create',
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

  it('role name should be unique', function(done) {
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

  it('should grant correct permission for role', function(done) {
    async.waterfall([
      function(next) {
        Permission.create({
          action: 'read',
          resource: 'post'
        }, next);
      },
      function(permission, next) {
        Role.create({
          name: 'member'
        }, function(err, role) {
          if (err) {
            return next(err);
          }
          role.grant(permission, next);
        });
      }
    ], function(err, role) {
      should.not.exist(err);
      role.permissions.should.have.length(1);
      done();
    });
  });

  it('should revoke correct permission for role', function(done) {
    async.waterfall([
      function(next) {
        Permission.create({
          action: 'read',
          resource: 'post'
        }, next);
      },
      function(permission, next) {
        Role.create({
          name: 'member'
        }, function(err, role) {
          if (err) {
            return next(err);
          }
          role.grant(permission, function(err, role) {
            next(err, role, permission);
          });
        });
      },
      function(role, permission, next) {
        role.revoke(permission, next);
      }
    ], function(err, role) {
      should.not.exist(err);
      role.permissions.should.have.length(0);
      done();
    });
  });

  it('check permission', function(done) {
    async.waterfall([
      function(next) {
        Permission.create({
          action: 'read',
          resource: 'post'
        }, next);
      },
      function(permission, next) {
        Role.create({
          name: 'member'
        }, function(err, role) {
          if (err) {
            return next(err);
          }
          role.grant(permission, next);
        });
      }
    ], function(err, role) {
      should.not.exist(err);
      role.can('read', 'post').should.be.true;
      role.can('create', 'post').should.be.false;
      done();
    });
  });

  it('should call storage\'s save method after permission or role changed', function(done) {
    var saveToStorageFunc = sinon.spy();
    provider._storage = {
      save: saveToStorageFunc
    };

    Permission.create({
      action: 'update',
      resource: 'post'
    }, function(err) {
      if (err) {
        return done(err);
      }

      setImmediate(function() {
        saveToStorageFunc.called.should.be.true;
        done();
      });
    });
  });
});
