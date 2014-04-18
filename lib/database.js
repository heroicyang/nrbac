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

/**
 * Exports database module
 */
var db = module.exports = new Database();

/**
 * Register schema hooks and methods
 */
schema.registerHooks(db);
schema.registerMethods();

/**
 * Expose models
 */
db.Permission = db.model('Permission', schema.PermissionSchema);
db.Role = db.model('Role', schema.RoleSchema);
