/**
 * Fake OAuth Server structurally derived from our ActiveSync server.  Not the
 * ideal cargo culting to perform, but it works.  It's all just a bit
 * structurally regrettable that we are evaluated in a sandbox context when we
 * absolutely don't need to be and the start/stop idioms and all that.
 **/
'use strict';

Components.utils.import('resource://fakeserver/modules/httpd.js');
Components.utils.import('resource://gre/modules/NetUtil.jsm');

/**
 * Convert an nsIInputStream into a string.
 *
 * @param stream the nsIInputStream
 * @return the string
 */
function stringifyStream(stream) {
  if (!stream.available())
    return '';
  return NetUtil.readInputStreamToString(stream, stream.available());
}

function OAuthServer(options) {
  this.server = new HttpServer(options);
  this.creds = options.creds;

  /**
   * The access tokens to issue.  If a string we just always return the same
   * access token.  If it's an array we'll shift them off the front for each
   * request.
   */
  this.issueTokens = options.issueTokens || 'access-token';
  /**
   * Track the number of access tokens provided so we can make sure the code
   * under test access for tokens exactly the right number of times.
   */
  this.numAccessTokensProvided = 0;
}
OAuthServer.prototype = {
  /**
   * Start the server on a specified port.
   */
  start: function(port) {
    // pretend we're the Google implementation
    this.server.registerPathHandler('/o/oauth2/auth',
                                    this._authEndpoint.bind(this));
    this.server.registerPathHandler('/o/oauth2/token',
                                    this._tokenEndpoint.bind(this));
    this.server.registerPathHandler('/backdoor',
                                    this._backdoorHandler.bind(this));
    this.server.start(port);
  },

  /**
   * Stop the server.
   *
   * @param callback A callback to call when the server is stopped.
   */
  stop: function(callback) {
    // httpd.js explodes if you don't provide a callback.
    if (!callback)
      callback = function() {};
    this.server.stop({ onStopped: callback });
  },

  /**
   * Eh, we don't need the auth endpoint quite yet.  It's expected that the
   * front-end is responsible for hitting the auth endpoint and performing
   * the initial redemption to get the refresh token.  When we start doing
   * more full-fledged integration tests we'll need this.
   */
  _authEndpoint: function(request, response) {
    response.setStatusLine('1.1', 400, 'NO Not implemented Yet');
  },

  /**
   * The token endpoint.  Currently this assumes the caller is providing a
   * valid refresh token.
   */
  _tokenEndpoint: function(request, response) {
    var nextAccessToken;
    if (typeof(this.issueTokens) === 'string') {
      nextAccessToken = this.issueTokens;
    }
    else {
      nextAccessToken = this.issueTokens.shift();
    }
    this.numAccessTokensProvided++;

    response.setStatusLine('1.1', 200, 'OK');
    response.write(JSON.stringify({
      access_token: nextAccessToken,
      expires_in: 60 * 60,
      token_type: 'Bearer'
    }));
  },

  _backdoorHandler: function(request, response) {
    let postData = JSON.parse(stringifyStream(request.bodyInputStream));

    let responseData = this['_backdoor_' + postData.command](postData);

    response.setStatusLine('1.1', 200, 'OK');
    if (responseData)
      response.write(JSON.stringify(responseData));
  },

  _backdoor_getNumAccessTokensProvided: function(params) {
    var result = this.numAccessTokensProvided;
    if (params.reset) {
      this.numAccessTokensProvided = 0;
    }
    return result;
  },
};
