/**
 * Test dependencies
 */
var should = require('should');
var MemoryStorage = require('../lib/storages/memory');

describe('MemoryStorage Constructor', function() {
  var memoryStorage = new MemoryStorage();

  it('should have the correct name set', function() {
    should.exist(memoryStorage);
    memoryStorage.name.should.eql('memory');
  });

  it('list(callback)', function(done) {
    memoryStorage.list(function(err, data) {
      should.not.exist(err);
      should.exist(data);
      done();
    });
  });

  it('save(data, callback)', function(done) {
    var data = {
      Permission: [{ action: 'create', resource: 'post' }],
      Role: [{ name: 'admin' }]
    };
    memoryStorage.save(data, function(err) {
      should.not.exist(err);
      memoryStorage.list(function(err, result) {
        result.should.eql(data);
        done();
      });
    });
  });
});
