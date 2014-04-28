/**
 * nrbac - lib/storages/file.js
 *
 * File storage.
 *
 * Copyright(c) 2014 Heroic Yang <me@heroicyang.com> (http://heroicyang.com)
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies
 */
var util = require('util');
var fs = require('fs');
var async = require('async');
var BaseStorage = require('./base');

var File = module.exports = function(filepath) {
  BaseStorage.call(this);
  this.name = 'file';

  if (!filepath) {
    throw new Error('Required FileStorage option `filepath` missing');
  }
  this.filepath = filepath;
};

util.inherits(File, BaseStorage);

File.prototype.list = function(callback) {
  var self = this;
  var defaultData = {
    permissions: [],
    roles: []
  };

  async.waterfall([
    function(next) {
      fs.exists(self.filepath, function(exists) {
        if (exists) {
          return next(null, exists);
        }
        fs.writeFile(self.filepath, JSON.stringify(defaultData, null, 2), function(err) {
          next(err, exists);
        });
      });
    },
    function(fileExists, next) {
      if (!fileExists) {
        return next(null, defaultData);
      }

      fs.readFile(self.filepath, function(err, data) {
        if (err) {
          return next(err);
        }

        try {
          data = JSON.parse(data);
          if (!(data.permissions || data.roles)) {
            data = defaultData;
          }
        } catch (e) {
          data = defaultData;
        }
        
        next(null, data);
      });
    }
  ], callback);
};

File.prototype.save = function(data, callback) {
  fs.writeFile(this.filepath, JSON.stringify(data, null, 2), callback);
};
