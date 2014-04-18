nrbac
=====

> Easy to use generic [RBAC(Role-Based Access Control)](https://en.wikipedia.org/wiki/Role-based_access_control) for node.

## Install

```bash
$ npm install nrbac --save
```

## Example

```javascript
var rbac = require('nrbac');
var async = require('async');

async.auto({
  permission: function(next) {
    rbac.Permission.create({
      action: 'create',
      resource: 'post'
    }, next);
  },
  role: function(next) {
    rbac.Role.create({
      name: 'admin'
    }, next);
  },
  roleGranted: ['permission', 'role', function(next, result) {
    var permission = result.permission;
    var role = result.role;

    // grant permission
    role.grant(permission, next);
  }]
}, function(err, results) {
  var role = results.roleGranted;
  role.can('create', 'post');  // true
  role.can('update', 'post');  // false
});
```

## Hierarchical

## Storage Engines

### Memory

### File

### MongoDB

### MySQL
