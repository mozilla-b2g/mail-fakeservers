suite('imap_stack', function() {
  var fakeserver = require('../');
  var creds = { username: 'testy', password: 'testy' };

  var subject;
  setup(function(done) {
    fakeserver.create(function(err, server) {
      if (err) return done(err);
      server.createImapStack({ credentials: creds }, function(err, stack) {
        subject = stack;
        done(err);
      });
    });
  });

  suite('#getFolderByPath', function() {
    test('inbox', function(done) {
      subject.getFolderByPath({ name: 'inbox' }, function(err, value) {
        assert.equal(value, 'INBOX');
        done();
      });
    });
  });

  suite('#addFolder', function() {
    var folder = 'foo';
    setup(function(done) {
      subject.addFolder({ name: folder }, done);
    });

    test('folder is there', function(done) {
      subject.getFolderByPath({ name: folder }, function(err, value) {
        assert.equal(value, folder);
        done();
      });
    });
  });
});
