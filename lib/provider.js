/**
 * nrbac - lib/provider.js
 *
 * RBAC provider.
 *
 * Copyright(c) 2014 Heroic Yang <me@heroicyang.com> (http://heroicyang.com)
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies
 */
var _ = require('lodash');
var async = require('async');
var Database = require('warehouse');
var schema = require('./schema');
var MemoryStorage = require('./storages/memory');

var db = new Database();

var Provider = module.exports = function Provider(storage) {
  this.use(storage || new MemoryStorage());
  this._db = db;
  this.models = schema.model(this);
};

Provider.prototype.use = function(storage) {
  this._storage = storage;
};

Provider.prototype.list = function(callback) {
  var models = this.models;

  this.sync(function(err) {
    if (err) {
      return callback(err);
    }

    var data = {
      permissions: models.Permission.list(),
      roles: models.Role.list()
    };
    callback(null, data);
  });
};

Provider.prototype.sync = function(callback) {
  var self = this;
  var models = this.models;

  async.waterfall([
    function listLatest(next) {
      self._storage.list(next);
    },
    function restore(data, next) {
      var permissions = _.filter(data.permissions, function(permission) {
        return !!permission._id;
      });
      var newPermissions = _.filter(data.permissions, function(permission) {
        return !permission._id;
      });
      var roles = _.filter(data.roles, function(role) {
        return !!role._id;
      });
      var newRoles = _.filter(data.roles, function(role) {
        return !role._id;
      });

      // omit permissions of newRoles
      var newRolePermissions = [];
      newRoles = _.map(newRoles, function(role) {
        if (role.permissions && role.permissions.length) {
          newRolePermissions.push({
            roleName: role.name,
            permissions: role.permissions.slice(0)
          });
        }
        return _.omit(role, 'permissions');
      });

      if (permissions.length || roles.length) {
        self._db._restore({
          permissions: permissions,
          roles: roles
        });
      }

      async.auto({
        permissions: function(next) {
          if (newPermissions.length === 0) {
            return next(null);
          }
          models.Permission.create(newPermissions, next);
        },
        roles: function(next) {
          if (newRoles.length === 0) {
            return next(null);
          }
          models.Role.create(newRoles, next);
        },
        grant: ['permissions', 'roles', function(next) {
          if (newRolePermissions.length === 0) {
            return next(null);
          }

          async.each(newRolePermissions, function(item, next) {
            var role = models.Role.findOne({ name: item.roleName });
            if (!role) {
              return next(null);
            }

            var permissions = [];
            _.each(item.permissions, function(permission) {
              var p = models.Permission.findOne({
                action: permission.action,
                resource: permission.resource
              });

              if (p) {
                permissions.push(p);
              }
            });

            if (permissions.length === 0) {
              return next(null);
            }

            role.grant(permissions, next);
          }, next);
        }]
      }, function(err) {
        next(err);
      });
    }
  ], callback);
};
