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

Creates permissions, `permission` can be an object consists of an `action` and a `resource`, or an array of objects.
- `permission` Object or Array (of [Object, Object, ...])
- `callback(err, permission)` Function

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

Gets permission with the specified `action` and `resource`, return an instance of `nrbac.PermissionModel`.
- `action` String
- `resource` String

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

Creates roles, `role` can be an object consists of a unique `name`, or an array of objects.
- `role` Object or Array (of [Object, Object, ...])
- `callback(err, role)` Function

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

Gets role with the specified `name`, return an instance of `nrbac.RoleModel`.
- `name` String

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
- `updateObj` Object
- `callback(err, permission)` Function

```javascript
var permission = nrbac.Permission.get('create', 'post');
permission.update({
  resource: 'article'
}, function(err, permission) {});
```

#### permission.remove(callback)
- `callback(err, permission)` Function

Deletes the permission instance.

```javascript
var permission = nrbac.Permission.get('create', 'post');
permission.remove(function(err, permission) {});
```

### nrbac.RoleModel
#### role.grant(permission, callback)

Grants permissions to the role. `permission` can be an instance of `nrbac.PermissionModel`, or an array of objects.
- `permission` `nrbac.PermissionModel` or Array (of [PermissionModel, PermissionModel, ...])
- `callback(err, role)` Function

```javascript
var createPostPermission = nrbac.Permission.get('create', 'post');
var admin = nrbac.Role.get('admin');
admin.grant(createPostPermission, function(err, role) {
  // role granted permissions
});
```

#### role.can(action, resource)

Checks if the role has the given permission.
- `action` String
- `resource` String

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
- `updateObj` Object
- `callback(err, role)` Function

```javascript
var role = nrbac.Role.get('superadmin');
role.update({ name: 'root' }, function(err, role) {});
```

#### role.remove(callback)

Deletes the role instance.
- `callback(err, role)` Function

```javascript
var role = nrbac.Role.get('superadmin');
role.remove(function(err, role) {});
```

### nrbac.use(storage)

Use the specified storage.
- `storage` `nrbac.BaseStorage`

```javascript
nrbac.use(new nrbac.MemoryStorage());
```

### nrbac.sync(callback)

Synchronizes data between `nrbac` and storage engine you are using.
- `callback(err)` Function

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

// if you create permissions or roles, or grant permissions to roles...
//   you must call the `sync` method to synchronize the data to storage.
nrbac.Role.create({ name: 'vip' });
nrbac.sync(function(err) {
  // data has been synchronized to the storage you are using
});
```

### nrbac.list(callback)

Lists all data.
- `callback(err, data)` Function

```javascript
nrbac.list(function(err, data) {
  // data output:
  // {
  //   permissions: [{ action: 'action', resource: 'resource' }, ...],
  //   roles: [{ name: 'roleName' }, ...]
  // }
});
```

## Storage Engines

### Memory

A simple in-memory storage engine that stores a literal Object representation of the RBAC data.

```javascript
var memoryStorage = new nrbac.MemoryStorage();
nrbac.use(MemoryStorage);

// you can specify the initial data
var memoryStorage = new nrbac.MemoryStorage({
  permissions: [{ action: 'read', resource: 'post' }],
  roles: [{ name: 'admin' }]
});
```

### File

File storage engine allow you to read your RBAC data from `.json` file, and data will be persisted to disk when a call to `nrbac.sync()` is made.

### MongoDB

A MongoDB-based storage engine.

### SQL

A SQL-based storage engine, you can use **MySQL**, **PostgreSQL**, and **SQLite3**.

## Run Tests

```bash
$ npm install
$ npm test
```

### Author: [Heroic Yang](https://github.com/heroicyang)
### License: MIT
