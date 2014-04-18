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
var db = require('./database');

var Provider = module.exports = function Provider() {};

_.extend(Provider.prototype, {
  use: function(storage) {
    this.storage = storage;
  }
});

Provider.db = db;
