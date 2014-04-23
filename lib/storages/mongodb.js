/**
 * nrbac - lib/storages/mongodb.js
 *
 * MongoDB storage.
 *
 * Copyright(c) 2014 Heroic Yang <me@heroicyang.com> (http://heroicyang.com)
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies
 */
var util = require('util');
var url = require('url');
var async = require('async');
var mongodb = require('mongodb');
var BaseStorage = require('./base');

/**
 * MongoDBStorage constructor
 *
 * @param  Object  options
 *   - server
 *   - database
 *   - username  optional
 *   - password  optional
 */
var MongoDB = module.exports = function(options) {
  BaseStorage.call(this);
  this.name = 'mongodb';

  var conn = {
    protocol: 'mongodb',
    host: '//' + options.server,
    pathname: '/' + options.database
  };
  if (options.username && options.password) {
    conn.auth = options.username + ':' + options.password;
  }
  conn = url.format(conn);

  var self = this;
  mongodb.MongoClient.connect(conn, function(err, db) {
    if (err) {
      throw err;
    }
    self.db = db;
  });
};

util.inherits(MongoDB, BaseStorage);

MongoDB.prototype.list = function(callback) {
  if (!this.db) {
    return callback(new Error('MongoDB is not connected'));
  }

  var db = this.db;
  async.parallel({
    permissions: function(next) {
      db.collection('permissions').find({}, next);
    },
    roles: function(next) {
      db.collection('roles').find({}, next);
    }
  }, callback);
};

MongoDB.prototype.save = function(data, callback) {
  if (!this.db) {
    return callback(new Error('MongoDB is not connected'));
  }

  var db = this.db;
  async.auto({
    removePermissions: function(next) {
      db.collection('permissions')
        .findAndModify({}, null, null, { remove: true }, next);
    },
    removeRoles: function(next) {
      db.collection('roles')
        .findAndModify({}, null, null, { remove: true }, next);
    },
    savePermissions: ['removePermissions', function(next) {
      db.collection('permissions').insert(data.permissions, next);
    }],
    saveRoles: ['removeRoles', function(next) {
      db.collection('roles').insert(data.roles, next);
    }],
  }, function(err) {
    callback(err);
  });
};
