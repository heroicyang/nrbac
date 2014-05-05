/**
 * nrbac - lib/storages/mongo.js
 *
 * MongoDB storage.
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
    tableName: 'permissions',
    toJSON: function() {
      var attrs = _.assign({}, this.attributes);
      attrs.dispalyName = attrs.display_name;
      attrs._id = attrs.nrbac_id;
      
      return _.omit(attrs, ['nrbac_id', 'display_name']);
    }
  });
  var RoleModel = this.RoleModel = bookshelf.Model.extend({
    tableName: 'roles',
    permissions: function() {
      return this.belongsToMany(PermissionModel, 'roles_permissions');
    },
    toJSON: function() {
      var attrs = _.assign({}, this.attributes);
      attrs.dispalyName = attrs.display_name;
      attrs._id = attrs.nrbac_id;
      attrs.permissions = _.map(attrs.permissions, function(permission) {
        return permission.toJSON();
      });
      
      return _.omit(attrs, ['nrbac_id', 'display_name']);
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
  var model;

  item.nrbac_id = item._id;
  item = _.omit(item, '_id');

  if (item.hasOwnProperty('action') && item.hasOwnProperty('resource')) {
    model = this.PermissionModel;
  } else if (item.hasOwnProperty('name')) {
    model = this.RoleModel;
  } else {
    return callback(new Error('Error RBAC data'));
  }

  async.waterfall([
    function(next) {
      model.forge({ nrbac_id: item.nrbac_id }).fetch()
        .then(function(item) {
          next(null, item);
        })
        .catch(function(e) {
          next(e);
        });
    },
    function(obj, next) {
      if (obj) {
        obj.save(item)
          .then(function() {
            next(null);
          })
          .catch(function(e) {
            next(e);
          });
      } else {
        model.forge(item).save(null)
          .then(function() {
            next(null);
          })
          .catch(function(e) {
            next(e);
          });
      }
    }
  ], callback);
};

SqlStorage.prototype.list = function(callback) {
  var self = this;
  async.parallel({
    permissions: function(next) {
      self.PermissionCollection.forge().fetch()
        .then(function(items) {
          next(null, items.toJSON());
        })
        .catch(function(e) {
          next(e);
        });
    },
    roles: function(next) {
      self.RoleCollection.forge().fetch({ withRelated: 'permissions' })
        .then(function(items) {
          next(null, items.toJSON());
        })
        .catch(function(e) {
          next(e);
        });
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
            permission.destroy()
              .then(function() {
                next(null);
              })
              .catch(function(e) {
                next(e);
              });
          }, next);
        })
        .catch(function(e) {
          next(e);
        });
    },
    function(next) {
      self.RoleCollection.forge().fetch()
        .then(function(roles) {
          async.each(roles, function(role, next) {
            role.destroy()
              .then(function() {
                next(null);
              })
              .catch(function(e) {
                next(e);
              });
          }, next);
        })
        .catch(function(e) {
          next(e);
        });
    }
  ], callback);
};