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
var BaseStorage = require('./base');

var File = module.exports = function(filepath) {
  BaseStorage.call(this);
  this.name = 'file';
  this.filepath = filepath;
};

util.inherits(File, BaseStorage);

File.prototype.list = function(callback) {
  fs.readFile(this.filepath, function(err, data) {
    if (err) {
      return callback(err);
    }
    callback(null, JSON.parse(data));
  });
};

File.prototype.save = function(data, callback) {
  fs.writeFile(this.filepath, JSON.stringify(data, null, 2), callback);
};
