Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
const Cu = Components.utils;
const Cc = Components.classes;
const Ci = Components.interfaces;

Cu.import('resource://gre/modules/FileUtils.jsm');

const mozIJSSubScriptLoader = Cc[
  '@mozilla.org/moz/jssubscript-loader;1'
].getService(
  Components.interfaces.mozIJSSubScriptLoader
);

  // try to start a server
EventLoop = (function() {
  var exit = false;

  return {
    start: function() {
      var th = Components.classes['@mozilla.org/thread-manager;1']
                          .getService();
      var thr = th.currentThread;

      while (thr.hasPendingEvents() || !exit) {
        thr.processNextEvent(true);
      }

    },

    stop: function() {
      exit = true;
    }
  };
}());

try {
  /** horrible hacks to to expose console.log */

  /**
   * multi-argument dump + newline ending.
   *
   *    log('warn:', 'fobar'); // "warn: fobar\n"
   *
   * @private
   */
  function log() {
    dump(Array.slice(arguments).join(' ') + '\n');
  }

  console = {
    log: log,
    warn: log.bind(null, 'WARN: '),
    error: log.bind(null, 'ERR: ')
  };

  // Map resource://fakeserver to lib/
  var fileObj = Cc['@mozilla.org/file/local;1']
               .createInstance(Ci.nsILocalFile);
  fileObj.initWithPath(_ROOT + '/xpcom/');

  let(ios = Components.classes['@mozilla.org/network/io-service;1']
             .getService(Components.interfaces.nsIIOService)) {

    let protocolHandler =
      ios.getProtocolHandler('resource')
         .QueryInterface(Components.interfaces.nsIResProtocolHandler);

    let curDirURI = ios.newFileURI(fileObj);
    protocolHandler.setSubstitution('fakeserver', curDirURI);
  }

  mozIJSSubScriptLoader.loadSubScript(
    'resource://fakeserver/fake-server-support.js'
  );

  var server = FakeServerSupport.makeIMAPServer(
    { username: 'testy', password: 'testy' }
  );

  EventLoop.start();

} catch(e) {
  dump('Erorr:\n');
  dump(e.toString() + '\n');
  dump(e.message + '\n');
  dump(e.stack);
}
