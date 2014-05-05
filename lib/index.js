/**
 * nrbac - lib/index.js
 *
 * Top-level include for the nrbac module.
 *
 * Copyright(c) 2014 Heroic Yang <me@heroicyang.com> (http://heroicyang.com)
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies
 */
var _ = require('lodash');
var model = require('./model');
var Provider = require('./provider');

/**
 * Exports nrbac module
 */
var nrbac = module.exports = new Provider();

var PermissionModel = model.Permission;
var RoleModel = model.Role;

/**
 * Expose submodules
 */
_.assign(nrbac, {
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
  Provider: Provider,
  PermissionModel: PermissionModel,
  RoleModel: RoleModel
});

/**
 * Setup all storages as lazy-loaded getters
 */
['File', 'MongoDB'].forEach(function(module) {
  var name = module + 'Storage';
  nrbac.__defineGetter__(name, function() {
    return require('./storages/' + module.toLowerCase());
  });
});
