/**
 * nrbac - lib/storages/sql.js
 *
 * SQL storage.
 *
 * Copyright(c) 2014 Heroic Yang <me@heroicyang.com> (http://heroicyang.com)
 * MIT Licensed
 */

'use strict';

/* jshint camelcase: false */

/**
 * Module dependencies
 */
var _ = require('lodash');
var async = require('async');
var Bookshelf = require('bookshelf');

var SqlStorage = module.exports = function(options) {
  this.type = 'sql';
  var bookshelf = Bookshelf.nrbac = Bookshelf.initialize(options);

  var PermissionModel = this.PermissionModel = bookshelf.Model.extend({
    tableName: 'permissions'
  });
  var RoleModel = this.RoleModel = bookshelf.Model.extend({
    tableName: 'roles',
    permissions: function() {
      return this.belongsToMany(PermissionModel, 'roles_permissions');
    },
    toJSON: function() {
      var attrs = _.assign({}, this.attributes);
      _.each(this.relations, function(relation, key) {
        attrs[key] = relation.toJSON();
      });
      
      return attrs;
    }
  });

  this.PermissionCollection = bookshelf.Collection.extend({
    model: PermissionModel
  });
  this.RoleCollection = bookshelf.Collection.extend({
    model: RoleModel
  });
};

SqlStorage.prototype.initialize = function(callback) {
  var knex = Bookshelf.nrbac.knex;
  async.parallel([
    function(next) {
      knex.schema.hasTable('permissions')
        .then(function(exists) {
          if (exists) {
            return next(null);
          }
          knex.schema.createTable('permissions', function(table) {
            table.charset('utf8');
            table.increments('id').primary();
            table.string('nrbac_id').notNullable();
            table.string('action').notNullable();
            table.string('resource').notNullable();
            table.unique(['action', 'resource']);
          }).then().nodeify(next);
        });
    },
    function(next) {
      knex.schema.hasTable('roles')
        .then(function(exists) {
          if (exists) {
            return next(null);
          }
          knex.schema.createTable('roles', function(table) {
            table.charset('utf8');
            table.increments('id').primary();
            table.string('nrbac_id').notNullable();
            table.string('name').notNullable().unique();
          }).then().nodeify(next);
        });
    },
    function(next) {
      knex.schema.hasTable('roles_permissions')
        .then(function(exists) {
          if (exists) {
            return next(null);
          }
          knex.schema.createTable('roles_permissions', function(table) {
            table.charset('utf8');
            table.increments('id').notNullable().primary();
            table.integer('role_id').notNullable();
            table.integer('permission_id').notNullable();
            table.unique(['role_id', 'permission_id']);
          }).then().nodeify(next);
        });
    }
  ], callback);
};

SqlStorage.prototype.set = function(item, callback) {
  var self = this;
  item.nrbac_id = item._id;
  item = _.omit(item, '_id');

  if (item.hasOwnProperty('action') && item.hasOwnProperty('resource')) {
    item = _.pick(item, ['nrbac_id', 'action', 'resource']);

    async.waterfall([
      function(next) {
        self.PermissionModel.forge({ nrbac_id: item.nrbac_id }).fetch()
          .then().nodeify(next);
      },
      function(permission, next) {
        if (permission) {
          permission.save(item).then().nodeify(next);
        } else {
          self.PermissionModel.forge(item).save(null).then().nodeify(next);
        }
      }
    ], function(err) {
      callback(err);
    });
  } else if (item.hasOwnProperty('name')) {
    var rolePermissions = item.permissions;
    item = _.pick(item, ['nrbac_id', 'name']);

    async.waterfall([
      function(next) {
        self.RoleModel.forge({ nrbac_id: item.nrbac_id }).fetch()
          .then().nodeify(next);
      },
      function(role, next) {
        if (role) {
          role.save(item).then().nodeify(next);
        } else {
          self.RoleModel.forge(item).save(null).then().nodeify(next);
        }
      },
      function(role, next) {
        if (rolePermissions && rolePermissions.length) {
          var permissionIds = _.pluck(role.toJSON().permissions, 'id');
          async.auto({
            rolePermissionIds: function(next) {
              self.PermissionCollection.forge([])
                .query('whereIn', 'nrbac_id', rolePermissions)
                .fetch()
                .then(function(results) {
                  return _.pluck(results.toJSON(), 'id');
                }).nodeify(next);
            },
            detachExists: function(next) {
              if (permissionIds.length === 0) {
                return next(null);
              }
              role.related('permissions').detach(permissionIds).then().nodeify(next);
            },
            attach: ['rolePermissionIds', 'detachExists', function(next, results) {
              var rolePermissionIds = results.rolePermissionIds;
              role.related('permissions').attach(rolePermissionIds).then().nodeify(next);
            }]
          }, next);
        } else {
          next(null);
        }
      }
    ], function(err) {
      callback(err);
    });
  } else {
    return callback(new Error('Error RBAC data'));
  }
};

SqlStorage.prototype.list = function(callback) {
  var self = this;
  async.parallel({
    permissions: function(next) {
      self.PermissionCollection.forge().fetch()
        .then(function(items) {
          return _.map(items.toJSON(), function(item) {
            item.dispalyName = item.display_name;
            item._id = item.nrbac_id;
            return _.omit(item, ['id', 'nrbac_id', 'display_name']);
          });
        }).nodeify(next);
    },
    roles: function(next) {
      self.RoleCollection.forge().fetch({ withRelated: 'permissions' })
        .then(function(items) {
          return _.map(items.toJSON(), function(item) {
            item.dispalyName = item.display_name;
            item._id = item.nrbac_id;
            item.permissions = _.map(item.permissions, function(permission) {
              permission.dispalyName = permission.display_name;
              permission._id = permission.nrbac_id;
              return _.omit(permission,
                ['id', 'nrbac_id', 'display_name','_pivot_role_id', '_pivot_permission_id']);
            });
            return _.omit(item, ['id', 'nrbac_id', 'display_name']);
          });
        }).nodeify(next);
    }
  }, callback);
};

SqlStorage.prototype.save = function(data, callback) {
  var self = this;
  async.parallel([
    function(next) {
      async.each(data.permissions, function(permission, next) {
        self.set(permission, next);
      }, next);
    },
    function(next) {
      async.each(data.roles, function(role, next) {
        self.set(role, next);
      }, next);
    },
  ], function(err) {
    callback(err);
  });
};

SqlStorage.prototype.clear = function(callback) {
  var self = this;
  async.parallel([
    function(next) {
      self.PermissionCollection.forge().fetch()
        .then(function(permissions) {
          async.each(permissions, function(permission, next) {
            permission.destroy().then().nodeify(next);
          }, next);
        });
    },
    function(next) {
      self.RoleCollection.forge().fetch()
        .then(function(roles) {
          async.each(roles, function(role, next) {
            role.destroy().then().nodeify(next);
          }, next);
        });
    }
  ], callback);
};