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

var Permission = db.model('Permission', schema.PermissionSchema);
var Role = db.model('Role', schema.RoleSchema);

/**
 * Exports database module
 */
module.exports = {
  Permission: {
    create: Permission.create.bind(Permission),
    get: function(action, resource) {
      return Permission.findOne({
        action: action,
        resource: resource
      });
    },
    list: Permission.list.bind(Permission),
    destroy: Permission.destroy.bind(Permission)
  },
  Role: {
    create: Role.create.bind(Role),
    get: function(name) {
      return Role.findOne({ name: name });
    },
    list: Role.list.bind(Role),
    destroy: Role.destroy.bind(Role)
  },
  export: function() {
    return db._export();
  }
};
