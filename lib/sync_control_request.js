var url = require('url');
var sockittome = require('sockit-to-me');

/**
 * Issue a synchronous request to the control server by using sockit-to-me and
 * its infamous synchronous socket API ways.
 *
 * @param {String} target for request.
 * @param {Object} details for request.
 * @return {Object}
 *   The result object on success or null on some kind of error.
 */
function request(target, details, callback) {
  var body = JSON.stringify(details);
  var parsedUrl = url.parse(target);
  var headers = [
    // content-type is not strictly needed but is good practice.
    'Content-Type: application/json',
    // content-length is required otherwise the control server cannot read
    // the body.
    'Content-Length: ' + Buffer.byteLength(body)
  ];

  var sockit = new sockittome.Sockit();
  sockit.connect({
    host: parsedUrl.hostname,
    port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 80
  });

  // We demanded HTTP/1.0 so the connection will get closed on us and this is
  // less horrible than it otherwise might be.  We could also be 1.1 and do
  // "connection: close" but then maybe other horrible things would happen.
  var requestString = 'POST ' + parsedUrl.path + ' HTTP/1.0\r\n' +
                        headers.join('\r\n') + '\r\n\r\n';
  sockit.write(requestString + body);
  // Keep reading until we run out of data and the connection ends up closed.
  // The read command absolutely tries to read all the bytes you told it to read
  // so we either need a byte size of 1 or to understand the reported content
  // length.  So the easy thing wins!  Join with me and hit your Staples brand
  // "Easy" button!  (Note that our returned strings are usually going to be
  // super short.)
  var aggregateStr = '';
  while (sockit) {
    try {
      var received = sockit.read(1);
      aggregateStr += received.toString();
    }
    catch (ex) {
      // the connection must have closed.  hooray!
      sockit = null;
      break;
    }
  }
  var match = /^HTTP\/\d+\.\d+ (\d+)/.exec(aggregateStr);
  var status = parseInt(match[1], 10);

  if (status !== 200) {
    return null;
  }

  var endOfHeaders = aggregateStr.indexOf('\r\n\r\n');
  var dataStr = aggregateStr.substring(endOfHeaders + 4);
  var dataObj = JSON.parse(dataStr);
  return dataObj;
}

module.exports = request;
