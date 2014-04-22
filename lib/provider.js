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
var db = require('./database');
var MemoryStorage = require('./storages/memory');

var Provider = module.exports = function Provider(storage) {
  this.use(storage || new MemoryStorage());
};

Provider.prototype.use = function(storage) {
  this._storage = storage;
};

Provider.prototype.list = function(callback) {
  this.sync(function(err) {
    if (err) {
      return callback(err);
    }

    callback(null, JSON.parse(db.export()));
  });
};

Provider.prototype.sync = function(callback) {
  var self = this;
  async.waterfall([
    function saveToStorage(next) {
      var data = JSON.parse(db.export());
      if (_.isEmpty(data) || (_.isEmpty(data.Permission) && _.isEmpty(data.Role))) {
        return next(null);
      }

      self._storage.save(data, function(err) {
        next(err);
      });
    },
    function listLatest(next) {
      self._storage.list(next);
    },
    function restore(data, next) {
      db.Permission.destroy();
      db.Role.destroy();

      async.parallel([
        function(next) {
          db.Permission.create(data.Permission, next);
        },
        function(next) {
          db.Role.create(data.Role, next);
        }
      ], function(err) {
        next(err);
      });
    }
  ], callback);
};

Provider.db = db;
