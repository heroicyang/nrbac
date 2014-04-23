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
var Provider = require('./provider');

/**
 * Expose nrbac module
 */
var nrbac = module.exports = new Provider();

nrbac.Provider = Provider;
nrbac.Permission = Provider.db.Permission;
nrbac.Role = Provider.db.Role;
nrbac.BaseStorage = require('./storages/base');
nrbac.MemoryStorage = require('./storages/memory');
nrbac.FileStorage = require('./storages/file');
