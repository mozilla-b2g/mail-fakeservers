var syncControlRequest = require('./sync_control_request'),
    debug = require('debug')('mail-fakeserver:imapstack');

/**
 * Object which manages imap stack options.
 *
 * @constructor
 */
function IMAPStack(options) {
  debug('imap stack create', options);
  for (var key in options) {
    this[key] = options[key];
  }
}

/**
 * List of apis the imap stack supports.
 *
 * @type Array
 */
var APIS = [
  'setDate',
  'getFolderByPath',
  'addFolder',
  'removeFolder',
  'addMessagesToFolder',
  'modifyMessagesInFolder',
  'getMessagesInFolder'
];

/**
 * Generic api request wrapper for control server.
 *
 * @private
 * @param {String} api request type.
 * @param {Object} request details.
 * @param {Function} callback with server response.
 */
function apiRequest(api, request, callback) {
  var json = {
    command: api
  };

  for (var key in request) {
    json[key] = request[key];
  }

  syncControlRequest(this.controlUrl, json, callback);
}

APIS.forEach(function(key) {
  IMAPStack.prototype[key] = function() {
    var args = Array.prototype.slice.call(arguments);
    return apiRequest.apply(this, [key].concat(args));
  };
});

module.exports = IMAPStack;
