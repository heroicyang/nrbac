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
var async = require('async');
var Database = require('warehouse');
var schema = require('./schema');
var MemoryStorage = require('./storages/memory');

var Provider = module.exports = function Provider(storage) {
  this.use(storage || new MemoryStorage());
  this._db = new Database();
  this.models = schema.model(this);
};

Provider.prototype.use = function(storage) {
  this._storage = storage;
};

Provider.prototype.list = function(callback) {
  var self = this;
  this.sync(function(err) {
    if (err) {
      return callback(err);
    }

    callback(null, JSON.parse(self._db._export()));
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
      models.Permission.destroy();
      models.Role.destroy();

      async.parallel([
        function(next) {
          models.Permission.create(data.permissions, next);
        },
        function(next) {
          models.Role.create(data.roles, next);
        }
      ], function(err) {
        next(err);
      });
    }
  ], callback);
};
