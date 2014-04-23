/**
 * nrbac - lib/database.js
 *
 * Provides the basic data for RBAC.
 *
 * Copyright(c) 2014 Heroic Yang <me@heroicyang.com> (http://heroicyang.com)
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies
 */
var Database = require('warehouse');
var schema = require('./schema');

var db = new Database();

/**
 * Register schema hooks and methods
 */
schema.registerHooks(db);
schema.registerMethods();

var PermissionModel = db.model('permissions', schema.PermissionSchema);
var RoleModel = db.model('roles', schema.RoleSchema);

/**
 * Exports database module
 */
module.exports = {
  Permission: {
    create: PermissionModel.create.bind(PermissionModel),
    get: function(action, resource) {
      return PermissionModel.findOne({
        action: action,
        resource: resource
      });
    },
    list: PermissionModel.list.bind(PermissionModel),
    destroy: PermissionModel.destroy.bind(PermissionModel)
  },
  Role: {
    create: RoleModel.create.bind(RoleModel),
    get: function(name) {
      return RoleModel.findOne({ name: name });
    },
    list: RoleModel.list.bind(RoleModel),
    destroy: RoleModel.destroy.bind(RoleModel)
  },
  export: function() {
    return db._export();
  }
};
