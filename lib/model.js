/**
 * nrbac - lib/model.js
 *
 * Data schema.
 *
 * Copyright(c) 2014 Heroic Yang <me@heroicyang.com> (http://heroicyang.com)
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies
 */
var _ = require('lodash');
var Database = require('warehouse');
var Schema = Database.Schema;

var db = new Database();
var models;

// Exports models
module.exports = models || (models = createModels());
module.exports.db = db;

/**
 * Compile Models from Schemas
 *
 * @returns {Object}
 */
function createModels() {
  // Common methods

  /**
   * Creates batch documents, Model class method
   *
   * @param {Object|Array}  params
   * @param {Function}  callback(err, documents)
   */
  var createBatch = function(params, callback) {
    try {
      this.insert(params, function(results) {
        callback(null, results);
      });
    } catch (e) {
      callback(e);
    }
  };

  /**
   * Overrides document's update method, Model instance method
   *
   * @param {Object}  obj
   * @param {Function}  callback(err, document)
   */
  var update = function(obj, callback) {
    var _update = this.constructor.prototype.__proto__.update;
    try {
      _update.call(this, obj, function(updatedObj) {
        callback(null, updatedObj);
      });
    } catch (e) {
      callback(e);
    }
  };

  /**
   * Overrides document's remove method, Model instance method
   *
   * @param {Function}  callback(err, document)
   */
  var remove = function(callback) {
    var _remove = this.constructor.prototype.__proto__.remove;
    _remove.call(this, function(obj) {
      callback(null, obj);
    });
  };

  // Schema definition

  /**
   * Defines permissionSchema
   *
   * @return {Schema}
   */
  var permissionSchema = new Schema({
    action: { type: String, required: true },
    resource: { type: String, required: true },
    displayName: String,
    description: String
  });

  /**
   * Defines Permission Model class methods
   */
  permissionSchema.statics = {
    create: createBatch,
    /**
     * Lists all permissions
     *
     * @returns {Array}
     */
    list: function() {
      return this.find({}).toArray();
    }
  };

  /**
   * Defines Permission Model instance methods
   */
  permissionSchema.methods = {
    update: update,
    remove: remove
  };

  /**
   * Defines roleSchema
   */
  var roleSchema = new Schema({
    name: { type: String, required: true },
    displayName: String,
    description: String,
    permissions: [{ type: String, ref: 'permissions' }]
  });

  /**
   * Defines Role Model class methods
   */
  roleSchema.statics = {
    create: createBatch,
    /**
     * Lists all roles
     *
     * @returns {Array}
     */
    list: function() {
      return this.find({}).populate('permissions').map(function(role) {
        role.permissions = role.permissions.toArray();
        return role;
      });
    }
  };

  /**
   * Defines Role Model instance methods
   */
  roleSchema.methods = {
    update: update,
    remove: remove,
    /**
     * Grants permissions for role
     *
     * @param {Object|Array}  permission  instance of PermissionModel
     * @param {Function}  callback(err, role)
     */
    grant: function(permission, callback) {
      var _update = this.constructor.prototype.__proto__.update;

      if (_.isArray(permission)) {
        _update.call(this, {
          permissions: {
            $addToSet: _.pluck(permission, '_id')
          }
        }, function(role) {
          callback(null, role);
        });
      } else {
        _update.call(this, {
          permissions: { $addToSet: permission._id }
        }, function(role) {
          callback(null, role);
        });
      }
    },
    /**
     * Revokes permissions for role
     *
     * @param {Object|Array}  permission  instance of PermissionModel
     * @param {Function}  callback(err, role)
     */
    revoke: function(permission, callback) {
      var _update = this.constructor.prototype.__proto__.update;

      if (_.isArray(permission)) {
        _update.call(this, {
          permissions: {
            $pull: _.pluck(permission, '_id')
          }
        }, function(role) {
          callback(null, role);
        });
      } else {
        _update.call(this, {
          permissions: { $pull: permission._id }
        }, function(role) {
          callback(null, role);
        });
      }
    },
    /**
     * Checks if the role has the given permission
     *
     * @param {String}  action
     * @param {String}  resource
     * @returns {Boolean}
     */
    can: function(action, resource) {
      var permissions = this.populate('permissions').permissions.toArray();
      var can = _.find(permissions, function(permission) {
        return permission && permission.action === action && permission.resource === resource;
      });
      return !!can;
    }
  };

  // Adds hooks

  var validPattern = /^[a-zA-Z0-9_\-]+$/;

  // Adds pre save hooks
  permissionSchema.pre('save', function(permission, next) {
    if (!validPattern.test(permission.action) ||
        !validPattern.test(permission.resource)) {
      return next(new Error('Invlid action or resource'));
    }

    var exists = models.Permission.findOne({
      action: permission.action,
      resource: permission.resource
    });
    if (exists && exists._id !== permission._id) {
      return next(new Error('Permission action and resource must be unique'));
    }

    next();
  });

  // Add pre save hooks
  roleSchema.pre('save', function(role, next) {
    if (!validPattern.test(role.name)) {
      return next(new Error('Invlid role name'));
    }

    var exists = models.Role.findOne({
      name: role.name
    });
    if (exists && exists._id !== role._id) {
      return next(new Error('Role name must be unique'));
    }

    next();
  });

  return {
    Permission: db.model('permissions', permissionSchema),
    Role: db.model('roles', roleSchema)
  };
}
