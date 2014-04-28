/**
 * nrbac - lib/storages/memory.js
 *
 * Memory storage.
 *
 * Copyright(c) 2014 Heroic Yang <me@heroicyang.com> (http://heroicyang.com)
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies
 */
var util = require('util');
var BaseStorage = require('./base');

var Memory = module.exports = function() {
  BaseStorage.call(this);
  this.name = 'memory';
  this._store = {};
};

util.inherits(Memory, BaseStorage);

Memory.prototype.list = function(callback) {
  var self = this;
  setTimeout(function() {
    callback(null, self._store);
  }, 0);
};

Memory.prototype.save = function(data, callback) {
  this._store = data;
  setTimeout(function() {
    callback(null);
  }, 0);
};
