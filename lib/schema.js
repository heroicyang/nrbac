/**
 * nrbac - lib/schema.js
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
var Schema = require('warehouse').Schema;

var PermissionSchema = exports.PermissionSchema = new Schema({
  action: { type: String, required: true },
  resource: { type: String, required: true },
  displayName: String,
  description: String
});

var RoleSchema = exports.RoleSchema = new Schema({
  name: { type: String, required: true },
  displayName: String,
  description: String,
  permissions: [{ type: String, ref: 'Permission' }]
});

exports.registerHooks = function(database) {
  var validPattern = /^[a-zA-Z0-9_\-]+$/;

  PermissionSchema.pre('save', function(permission, next) {
    if (!validPattern.test(permission.action) ||
        !validPattern.test(permission.resource)) {
      return next(new Error('Invlid action or resource'));
    }

    next();
  });

  PermissionSchema.pre('save', function(permission, next) {
    var exists = database.model('Permission').findOne({
      action: permission.action,
      resource: permission.resource
    });

    if (exists && exists._id !== permission._id) {
      return next(new Error('Permission action and resource must be unique'));
    }

    next();
  });

  RoleSchema.pre('save', function(role, next) {
    if (!validPattern.test(role.name)) {
      return next(new Error('Invlid role name'));
    }

    next();
  });

  RoleSchema.pre('save', function(role, next) {
    var exists = database.model('Role').findOne({
      name: role.name
    });

    if (exists && exists._id !== role._id) {
      return next(new Error('Role name must be unique'));
    }

    next();
  });
};

exports.registerMethods = function() {
  var createBatch = function(params, callback) {
    try {
      this.insert(params, function(results) {
        callback(null, results);
      });
    } catch (e) {
      callback(e);
    }
  };

  PermissionSchema.statics.create = createBatch;
  RoleSchema.statics.create = createBatch;

  PermissionSchema.statics.list = function() {
    return this.find({}).toArray();
  };

  RoleSchema.statics.list = function() {
    return this.find({}).populate('permissions').toArray();
  };

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

  var remove = function(callback) {
    var _remove = this.constructor.prototype.__proto__.remove;
    _remove.call(this, function(obj) {
      callback(null, obj);
    });
  };

  PermissionSchema.methods.update = update;
  PermissionSchema.methods.remove = remove;

  RoleSchema.methods.update = update;
  RoleSchema.methods.remove = remove;

  RoleSchema.methods.grant = function(permission, callback) {
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
  };

  RoleSchema.methods.can = function(action, resource) {
    var permissions = this.populate('permissions').permissions.toArray();
    var can = _.find(permissions, function(permission) {
      return permission && permission.action === action && permission.resource === resource;
    });
    return !!can;
  };
};
