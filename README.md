nrbac
=====

> Easy to use generic [RBAC(Role-Based Access Control)](https://en.wikipedia.org/wiki/Role-based_access_control) for node.

Inspired by [nconf](https://github.com/flatiron/nconf) !

## Install

```bash
$ npm install nrbac --save
```

## Example

```javascript
var rbac = require('nrbac');
var async = require('async');

async.waterfall([
  function(next) {
    rbac.Permission.create({
      action: 'create',
      resource: 'post'
    }, next);
  },
  function(permission, next) {
    rbac.Role.create({
      name: 'admin'
    }, function(err, role) {
      if (err) {
        return next(err);
      }
      // grant permission
      role.grant(permission, next);
    });
  }
], function(err, role) {
  role.can('create', 'post');  // true
  role.can('update', 'post');  // false
});
```

## API Documentation

The top-level of `nrbac` is an instance of the` nrbac.Provider` abstracts this all for you into a simple API.

### nrbac.Permission.create(permission, callback)

Creates permissions.
- `permission` {Object | Array} *Can be an object consists of an `action` and a `resource`, or an array of objects.*
- `callback(err, permission)` {Function}

```javascript
nrbac.Permission.create({
  action: 'create',
  resource: 'post'
}, function(err, permission) {
  // permission is an instance of nrbac.PermissionModel
});

nrbac.Permission.create([
  { action: 'update', resource: 'post' },
  { action: 'delete', resource: 'post' }
], function(err, permissions) {});
```

### nrbac.Permission.get(action, resource)

Gets permission with the specified `action` and `resource`.
- `action` {String}
- `resource` {String}

Return an instance of `nrbac.PermissionModel`.

```javascript
var createPostPermission = nrbac.Permission.get('create', 'post');
```

### nrbac.Permission.list()

Lists all permissions.

```javascript
var permissions = nrbac.Permission.list();
```

### nrbac.Permission.destroy()

Deletes all permissions.

```javascript
nrbac.Permission.destroy();
nrbac.Permission.list().should.be.empty;
```

### nrbac.Role.create(role, callback)

Creates roles.
- `role` {Object | Array} *Can be an object consists of a unique `name`, or an array of objects*
- `callback(err, role)` {Function}

```javascript
nrbac.Role.create({ name: 'member' }, function(err, role) {
  // role is an instance of nrbac.RoleModel
});

nrbac.Role.create([
  { name: 'admin' },
  { name: 'superadmin' }
], function(err, roles) {});
```

### nrbac.Role.get(name)

Gets role with the specified `name`.
- `name` {String}

Return an instance of `nrbac.RoleModel`.

```javascript
var admin = nrbac.Role.get('admin');
```

### nrbac.Role.list()

Lists all roles.

```javascript
var roles = nrbac.Role.list();
```

### nrbac.Role.destroy()

Deletes all roles.

```javascript
nrbac.Role.destroy();
nrbac.Role.list().should.be.empty;
```

### nrbac.PermissionModel
#### permission.update(updateObj, callback)

Updates the permission instance.
- `updateObj` {Object}
- `callback(err, permission)` {Function}

```javascript
var permission = nrbac.Permission.get('create', 'post');
permission.update({
  resource: 'article'
}, function(err, permission) {});
```

#### permission.remove(callback)
- `callback(err, permission)` {Function}

Deletes the permission instance.

```javascript
var permission = nrbac.Permission.get('create', 'post');
permission.remove(function(err, permission) {});
```

### nrbac.RoleModel
#### role.grant(permission, callback)

Grants permissions to the role.
- `permission` {PermissionModel | Array of PermissionModel} *Can be an instance of `nrbac.PermissionModel`, or an array of objects*
- `callback(err, role)` {Function}

```javascript
var createPostPermission = nrbac.Permission.get('create', 'post');
var admin = nrbac.Role.get('admin');
admin.grant(createPostPermission, function(err, role) {
  // role granted permissions
});
```

#### role.can(action, resource)

Checks if the role has the given permission.
- `action` {String}
- `resource` {String}

```javascript
var createPostPermission = nrbac.Permission.get('create', 'post');
var admin = nrbac.Role.get('admin');
admin.grant(createPostPermission, function(err, role) {
  role.can('create', 'post');  // true
  role.can('update', 'post');  // false
});
```

#### role.update(updateObj, callback)

Updates the role instance.
- `updateObj` {Object}
- `callback(err, role)` {Function}

```javascript
var role = nrbac.Role.get('superadmin');
role.update({ name: 'root' }, function(err, role) {});
```

#### role.remove(callback)

Deletes the role instance.
- `callback(err, role)` {Function}

```javascript
var role = nrbac.Role.get('superadmin');
role.remove(function(err, role) {});
```

### nrbac.use(storage)

Use the specified storage.
- `storage` {BaseStorage}

```javascript
nrbac.use(new nrbac.MemoryStorage());
```

### nrbac.sync(callback)

Synchronizes data from storage you are using.
- `callback(err)` {Function}

```javascript
var memoryStorage = new nrbac.MemoryStorage({
  permissions: [{ action: 'read', resource: 'post' }],
  roles: [{ name: 'admin' }]
});
nrbac.use(memoryStorage);

nrbac.sync(function(err) {
  // now you can obtain the storage data
  should.exist(nrbac.Permission.get('read', 'post'));
});
```

### nrbac.list(callback)

Lists all data.
- `callback(err, data)` {Function}

```javascript
nrbac.list(function(err, data) {
  // data output:
  // {
  //   permissions: [{ action: 'action', resource: 'resource' }, ...],
  //   roles: [{ name: 'roleName', permissions: [] }, ...]
  // }
});
```

## Storage Engines

### Memory

A simple in-memory storage engine that stores a literal Object representation of the RBAC data.
#### nrbac.MemoryStorage(initialData)
- `initialData` {Object} optional

```javascript
var memoryStorage = new nrbac.MemoryStorage();
nrbac.use(memoryStorage);

// you can specify the initial data
var memoryStorage = new nrbac.MemoryStorage({
  permissions: [{ action: 'read', resource: 'post' }],
  roles: [{ name: 'admin' }]
});
```

### File

File storage engine allow you to read your RBAC data from file, and data will be persisted to disk after changed.
#### nrbac.FileStorage(filepath)
- `filepath` {String}  (required)

```javascript
var fileStorage = new nrbac.FileStorage(__dirname + '/rbac.json');
nrbac.use(fileStorage);

// synchronizes data from __rbac.json__
nrbac.sync(function(err, data) {});
```

### MongoDB

A MongoDB-based storage engine.
#### nrbac.MongoDBStorage(options)
- `options` {Object}
  - `db` Database name or fully instantiated `node-mongo-native` object (required)
  - `host` MongoDB server hostname (optional, default: `127.0.0.1`)
  - `port` MongoDB server port (optional, default: `27017`)
  - `username` Username (optional)
  - `password` Password (optional)
  - `auto_reconnect` This is passed directly to the MongoDB `Server` constructor as the `auto_reconnect` option (optional, default: `false`)
  - `ssl` Use SSL to connect to MongoDB (optional, default: `false`)
  - `url` Connection url of the form: `mongodb://user:pass@host:port/database`. If provided, information in the URL takes priority over the other options

```javascript
var mongodbStorage = new nrbac.MongoDBStorage({
  db: 'your database'
});

nrbac.use(mongodbStorage);

// synchronizes data from mongodb
nrbac.sync(function(err, data) {});
```

### SQL

A SQL-based storage engine, you can use **MySQL**, **PostgreSQL**, and **SQLite3**.

## Run Tests

```bash
$ npm install
$ npm test
```

### Author: [Heroic Yang](https://github.com/heroicyang)
### License: MIT
