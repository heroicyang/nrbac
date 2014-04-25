/**
 * nrbac - lib/storages/mongodb.js
 *
 * MongoDB storage.
 *
 * Copyright(c) 2014 Heroic Yang <me@heroicyang.com> (http://heroicyang.com)
 * MIT Licensed
 */

'use strict';

/* jshint camelcase: false */

/**
 * Module dependencies
 */
var util = require('util');
var url = require('url');
var _ = require('lodash');
var async = require('async');
var mongodb = require('mongodb');
var BaseStorage = require('./base');

/**
 * Default options
 */
var defaultOptions = {
  host: '127.0.0.1',
  port: 27017,
  auto_reconnect: false,
  ssl: false,
  w: 1
};

/**
 * MongoDBStorage constructor
 *
 * @param  Object  options
 *   - db
 *   - host      optional
 *   - port      optional
 *   - username  optional
 *   - password  optional
 *   - auto_reconnect  optional
 *   - ssl       optional
 *   - url       optional
 */
var MongoDB = module.exports = function(options) {
  options = options || {};
  BaseStorage.call(this);
  this.name = 'mongodb';

  if(options.url) {
    var databaseUrl = url.parse(options.url);

    if (databaseUrl.port) {
      options.port = parseInt(databaseUrl.port);
    }

    if (databaseUrl.pathname !== undefined) {
      var pathname = databaseUrl.pathname.split('/');

      if (pathname.length >= 2 && pathname[1]) {
        options.db = pathname[1];
      }
    }

    if (databaseUrl.hostname !== undefined) {
      options.host = databaseUrl.hostname;
    }

    if (databaseUrl.auth !== undefined) {
      var auth = databaseUrl.auth.split(':');

      if (auth.length >= 1) {
        options.username = auth[0];
      }

      if (auth.length >= 2) {
        options.password = auth[1];
      }
    }
  }

  if(!options.db) {
    throw new Error('MongoDBStorage option `db` required');
  }

  if (typeof options.db === "object") {
    this.db = options.db;
  } else {
    var serverOptions = {};
    serverOptions.auto_reconnect = options.auto_reconnect || defaultOptions.auto_reconnect;
    serverOptions.ssl = options.ssl || defaultOptions.ssl;

    var server = new mongodb.Server(
      options.host || defaultOptions.host,
      options.port || defaultOptions.port,
      serverOptions
    );

    var dbOptions = { w: options.w || defaultOptions.w };

    this.db = new mongodb.Db(options.db, server, dbOptions);
  }

  this.collectionCache = {};

  // retrieve collection, and cached
  this._collection = function(name, callback) {
    var self = this;
    var cached = this.collectionCache[name];

    if (cached) {
      callback(cached);
    } else if (this.db.openCalled) {
      this.db.collection(name, function(err, collection) {
        if (err) {
          throw new Error('Error getting collection: ' + collection);
        }

        self.collectionCache[name] = collection;
        callback(collection);
      });
    } else {
      this._open(function() {
        self._collection(name, callback);
      });
    }
  };

  // open database
  this._open = function(callback){
    callback = callback || function() {};

    if (this.db.openCalled) {
      return callback();
    }

    if (this._opening) {
      return callback();
    }

    var self = this;
    this._opening = true;
    this.db.open(function(err, db) {
      if (err) {
        self._opening = false;
        if (!(err instanceof Error)) {
          err = new Error(String(err));
        }
        err.message = 'Error connecting to database: ' + err.message;
        throw err;
      }

      if (options.username && options.password) {
        db.authenticate(options.username, options.password, function() {
          self._opening = false;
          callback();
        });
      } else {
        self._opening = false;
        callback();
      }
    });
  };

  this._open();
};

util.inherits(MongoDB, BaseStorage);

MongoDB.prototype.list = function(callback) {
  var self = this;
  async.parallel({
    permissions: function(next) {
      self._collection('nrbac_permissions', function(collection) {
        collection.find().toArray(function(err, permissions) {
          if (err) {
            return next(err);
          }

          permissions = _.map(permissions, function(permission) {
            permission = _.omit(permission, '_id');
            permission._id = permission.nrbac_id;
            return _.omit(permission, 'nrbac_id');
          });
          next(null, permissions);
        });
      });
    },
    roles: function(next) {
      self._collection('nrbac_roles', function(collection) {
        collection.find().toArray(function(err, roles) {
          if (err) {
            return next(err);
          }

          roles = _.map(roles, function(role) {
            role = _.omit(role, '_id');
            role._id = role.nrbac_id;
            return _.omit(role, 'nrbac_id');
          });
          next(null, roles);
        });
      });
    }
  }, callback);
};

MongoDB.prototype.save = function(data, callback) {
  var self = this;
  async.auto({
    clear: function(next) {
      self.clear(next);
    },
    savePermissions: ['clear', function(next) {
      var permissions = _.map(data.permissions, function(permission) {
        permission.nrbac_id = permission._id;
        return _.omit(permission, '_id');
      });
      self._collection('nrbac_permissions', function(collection) {
        collection.insert(permissions, next);
      });
    }],
    saveRoles: ['clear', function(next) {
      var roles = _.map(data.roles, function(role) {
        role.nrbac_id = role._id;
        return _.omit(role, '_id');
      });
      self._collection('nrbac_roles', function(collection) {
        collection.insert(roles, next);
      });
    }],
  }, function(err) {
    callback(err);
  });
};

MongoDB.prototype.clear = function(callback) {
  var self = this;
  async.parallel([
    function(next) {
      self._collection('nrbac_permissions', function(collection) {
        collection.remove({}, next);
      });
    },
    function(next) {
      self._collection('nrbac_roles', function(collection) {
        collection.remove({}, next);
      });
    }
  ], function(err) {
    callback(err);
  });
};
