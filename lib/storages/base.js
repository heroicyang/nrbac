/**
 * nrbac - lib/storages/base.js
 *
 * Storage engines interface.
 *
 * Copyright(c) 2014 Heroic Yang <me@heroicyang.com> (http://heroicyang.com)
 * MIT Licensed
 */

'use strict';

var Storage = module.exports = function() {};

/**
 * Lists all RBAC data, an object with `Permission` and `Role` key,
 *   and value is an Array. Example: { Permission: [], Role: [] }
 * Must be rewritten by subclass.
 *
 * @param  {Function}  callback   first argument is `err`, second is RBAC data
 */
Storage.prototype.list = function(callback) {
  /* jshint unused: false */
  throw new Error('Storage#list method must be rewritten');
};

/**
 * Save all RBAC data.
 *
 * @param {Object}  data
 *   { Permission: [{ action: 'action', resource: 'resource' }, ...], Role: [{ name: 'roleName' }, ...] }
 * @param {Function}  callback   first argument is `err`
 */
Storage.prototype.save = function(data, callback) {
  /* jshint unused: false */
  throw new Error('Storage#save method must be rewritten');
};
