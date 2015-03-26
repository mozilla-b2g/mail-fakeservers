IMAP4, POP3, SMTP, and ActiveSync fake-server support.

They are used by both:
- the mozilla/gaia-email-libs-and-more repo for its (back-end) tests.
- the mozilla/gaia/apps/email JS integration tests.

NOTE: At the moment, this allows you to run two IMAP fake-server
implementations: one gecko-based server (imapd.js, from Thunderbird), and now,
additionally, a node-based IMAP fakeserver called
[hoodiecrow](https://github.com/andris9/hoodiecrow). For legacy reasons, both
are currently included; hoodiecrow is used by the GELAM unit tests, but imapd.js
is used by everything else.

The rest of this README references the original IMAP gecko-based fake server.

Most servers (except Hoodiecrow) need to run in a Gecko/Spidermonkey context,
but how that is accomplished varies by who is running them.  They are always
communicated with via HTTP.

- GELAM: The entire test infrastructure is run inside a b2g-desktop instance
  using xulrunner app mode.  Its API to us (mail-fakeservers) is directly via
  xpcom/fake-server-support.js.  GELAM's test runner uses makeControlHttpServer
  to spin up the HTTP control server in
  GELAM/test-runner/chrome/content/loggest-chrome-runner.js and then pass info
  on the URL into the test runner.  The abstraction layer over that stuff lives
  in the GELAM/test/unit/resources/th_fake_*.js

- Gaia Email App JS integration tests: The test infrastructure is actually a
  node.js instance so a Spidermonkey runtime has to be spun up.  For historical
  reasons, an xpcshell instance of the kind Gaia still uses (but is moving away
  from towards xulrunner style?), but a b2g-desktop instance or firefox instance
  in xulrunner app mode would probably be fine.  Our index.js file exposes this
  functionality and is the API used for all of this.  The Gaia side of things is
  centralized in GAIA/apps/email/test/marionette/lib/server_help.js.

  This scenario is a little awkward because of historical evolution and the
  various tools and hand.  But basically we spin up the xpcshell process then
  talk json-wire-protocol to it very briefly to figure out the the HTTP control
  server we should use to do everything after that.  (I think originally the
  thought was that we might talk more via the ipc/json-wire-protocol bridge but
  then it turned out we were already using HTTP for everything else.  The IPC
  interface can nicely be synchronous but we really don't want to be doing more
  over it.)

  If you find yourself in any of the following files, you are dealing with this
  scenario and only this scenario:

  - Node-space bits:
    - index.js
    - lib/server.js listens for the xpcshell to talk to it then talks
      json-wire-bridge with it
    - lib/imap_stack.js
  - xpcshell-space bits:
    - xpcom/bin/server.js Bootstraps the environment
    - xpcom/proxy/eventloop.js spins a JS event loop until told to exit
    - xpcom/proxy/handler.js connects to the node.js instance (namely
      lib/server.js), creates a control http server (from
      fake-server-support.js)
