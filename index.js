var HAR = require('har');

const HAR_VERSION = 1.2;
const MIME_TYPE = 'application/json; charset=utf-8';

const executions = [];

function getMimeType(members) {
  return members.filter((member) => {
    member.name === 'Content-Type';
  }).map((member) => {
    member.value;
  })[0] || MIME_TYPE;
}

function createRequest(aRequest) {
  var request = new HAR.Request({
    method: aRequest.method,
    url: aRequest.url.toString(),
    postData: new HAR.PostData({
      mimeType: getMimeType(aRequest.headers.members),
      text: aRequest.body === undefined ? '' : aRequest.body.toString()
    })
  });

  aRequest.url.query.members.forEach((member) => {
    request.addQuery(new HAR.Query({
      name: member.key,
      value: member.value
    }));
  });

  aRequest.headers.members.forEach((member) => {
    if (member.hasOwnProperty("disabled") && member.disabled) {
      return;
    }
    request.addHeader(new HAR.Header({
      name: member.key,
      value: member.key === 'Content-Length' ? member.value.toString() : member.value
    }));
  });

  return request;
}

function createResponse(aResponse) {
  if (aResponse === undefined || aResponse == null || (Object.keys(aResponse).length === 0 && aResponse.constructor === Object)) {
    throw new Error('Server Not Found');
  }

  var response = new HAR.Response({
    status: aResponse.code,
    statusText: aResponse.status,
    content: new HAR.PostData({
      mimeType: getMimeType(aResponse.headers.members),
      text: aResponse.text()
    })
  });

  aResponse.cookies.members.forEach((member) => {
    response.addCookie(new HAR.Cookie({
      name: member.key,
      value: member.value
    }));
  });

  aResponse.headers.members.forEach((member) => {
    response.addHeader(new HAR.Header({
      name: member.key,
      value: member.key === 'Content-Length' ? member.value.toString() : member.value
    }));
  });

  return response;
}

function createHar(summary) {
  var log = new HAR.Log({
    version: HAR_VERSION,
    creator: new HAR.Creator({
      name: summary.collection.name,
      version: summary.collection.id
    })
  });

  executions.forEach((execution) => {
    log.addEntry(new HAR.Entry({
      startedDateTime: execution.startedDateTime,
      request: createRequest(execution.request),
      response: createResponse(execution.response)
    }));
  });

  return { log: log };
}

function replacer(key, value) {
  return (key === '_request' || key === '_response') ? undefined : value;
}

/**
 * Reporter that outputs a HAR fle (default: newman-run-har-report.har).
 *
 * @param {Object} newman - The collection run object, with event hooks for reporting run details.
 * @param {Object} options - A set of collection run options.
 * @param {String} options.export - The path to which the summary object must be written.
 * @returns {*}
 */
module.exports = function(newman, options) {
  newman.on('request', (err, data) => {
    if (err) { return; }

    try {
      executions.push({
        startedDateTime: new Date().toISOString(),
        request: data.request,
        response: data.response
      })
    } catch (e) {
      console.error(e);
      return;
    }
  });

  newman.on('beforeDone', function (err, data) {
    if (err) { return; }

    try {
      newman.exports.push({
        name: 'newman-reporter-har',
        default: 'newman-report.har',
        path: options.export,
        content: JSON.stringify(createHar(data.summary), replacer, 2)
      });
    } catch (e) {
      console.error(e);
      return;
    }
  });
};
