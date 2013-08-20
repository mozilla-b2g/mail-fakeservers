suite('fakemail', function() {
  var fakemail = require('..'),
      net = require('net'),
      IMAPStack = require('../lib/imap_stack'),
      ControlServer = require('../lib/control_server');

  var creds = { user: 'testy', password: 'testy' };
  var subject;

  function connect() {
    setup(function(done) {
      fakemail.create(function(err, server) {
        subject = server;
        done();
      });
    });
  }

  function read(port, callback) {
    var socket = net.connect(port, function() {
      socket.once('error', callback);
      socket.on('data', function(buffer) {
        callback(null, buffer.toString(), socket);
      });
    });
  }

  test('#connect', function() {
    connect();

    test('is control server', function() {
      assert.ok(subject instanceof ControlServer);
    });

    test('has control .port', function() {
      assert.ok(subject.controlPort, 'has controlPort');
      assert.ok(typeof subject.controlPort === 'number', 'is a number');
    });
  });

  suite('#createImapStack', function() {
    var stack;

    setup(function(done) {
      subject.createImapStack({ credentials: creds }, function(err, _stack) {
        stack = _stack;
        done(err);
      });
    });

    test('stack details', function() {
      assert.ok(stack instanceof IMAPStack);
      assert.ok(stack.imapPort, 'has imap port');
      assert.ok(stack.smtpPort, 'has smtp port');
      assert.ok(stack.controlUrl, 'has control url');
    });

    test('smtp server', function(done) {
      read(stack.smtpPort, function(err, line, socket) {
        if (err) return callback(err);
        // 220 is SMTP ready
        assert.ok(line.match(/220/i), line + 'does not contain "imap"');
        socket.end();
        done();
      });
    });

    test('imap server', function(done) {
      read(stack.imapPort, function(err, line, socket) {
        if (err) return callback(err);
        assert.ok(line.match(/imap/i), 'line connect contains "imap"');
        socket.end();
        done();
      });
    });
  });
});
