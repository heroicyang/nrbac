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
    throw new Error('Required MongoDBStorage option `db` missing');
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
    } else if (this._opened) {
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
    if (this._opened) {
      return callback && callback();
    }

    if (this._opening) {
      return callback && setImmediate(callback);
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
          self._opened = true;
          callback && callback();
        });
      } else {
        self._opening = false;
        self._opened = true;
        callback && callback();
      }
    });
  };

  this._open();
};

util.inherits(MongoDB, BaseStorage);

MongoDB.prototype.get = function(args, callback) {
  var collectionName;
  if (args.hasOwnProperty('action') && args.hasOwnProperty('resource')) {
    collectionName = 'nrbac_permissions';
    args = _.pick(args, ['action', 'resource']);
  } else if (args.hasOwnProperty('name')) {
    collectionName = 'nrbac_roles';
    args = _.pick(args, 'name');
  } else {
    return callback(new Error('Error arguments'));
  }

  this._collection(collectionName, function(collection) {
    collection.findOne(args, function(err, item) {
      if (err) {
        return callback(err);
      }
      item = _.omit(item, '_id');
      item._id = item.nrbac_id;
      callback(null, _.omit(item, 'nrbac_id'));
    });
  });
};

MongoDB.prototype.set = function(item, callback) {
  var self = this;
  var collectionName;

  item.nrbac_id = item._id;
  item = _.omit(item, '_id');

  if (item.hasOwnProperty('action') && item.hasOwnProperty('resource')) {
    collectionName = 'nrbac_permissions';
  } else if (item.hasOwnProperty('name')) {
    collectionName = 'nrbac_roles';
  } else {
    return callback(new Error('Error RBAC data'));
  }

  async.waterfall([
    function(next) {
      self._collection(collectionName, function(collection) {
        collection.findOne({
          nrbac_id: item.nrbac_id
        }, next);
      });
    },
    function(obj, next) {
      self._collection(collectionName, function(collection) {
        if (obj) {
          collection.update({
            nrbac_id: item.nrbac_id
          }, item, function(err) {
            next(err);
          });
        } else {
          collection.save(item, function(err) {
            next(err);
          });
        }
      });
    }
  ], callback);
};

MongoDB.prototype.list = function(callback) {
  var self = this;
  var query = function(collectionName, callback) {
    this._collection(collectionName, function(collection) {
      collection.find().toArray(function(err, items) {
        if (err) {
          return callback(err);
        }

        items = _.map(items, function(item) {
          item = _.omit(item, '_id');
          item._id = item.nrbac_id;
          return _.omit(item, 'nrbac_id');
        });
        callback(null, items);
      });
    });
  };

  async.parallel({
    permissions: async.apply(query.bind(self), 'nrbac_permissions'),
    roles: async.apply(query.bind(self), 'nrbac_roles')
  }, callback);
};

MongoDB.prototype.save = function(data, callback) {
  var self = this;
  async.parallel([
    function(next) {
      async.each(data.permissions, function(permission, next) {
        self.set(permission, next);
      }, next);
    },
    function(next) {
      async.each(data.roles, function(role, next) {
        self.set(role, next);
      }, next);
    },
  ], function(err) {
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
