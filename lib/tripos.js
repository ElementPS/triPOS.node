'use strict';

var fs = require('fs');
var xml2js = require('xml2js');
var request = require('request');
var crypto = require('crypto');
var url = require('url');
var _ = require('lodash');
var uuid = require('uuid');

function getAuthFromConfig(pathToConfig, cb) {
  if(fs.existsSync(pathToConfig)) {
    fs.readFile(pathToConfig, function(err, data) {
      if(err) return cb(new Error('Error reading triPOS Config'));
      var parser = new xml2js.Parser();
      parser.parseString(data, function(err, results) {
        if(err) return cb(new Error('Error reading triPOS Config'));
        var auth = {
          developerKey: results.tripos.developers[0].developer[0].developerKey[0],
          developerSecret: results.tripos.developers[0].developer[0].developerSecret[0]
        };
        return cb(null, auth);
      });
    });
  } else {
    return cb(new Error('No config file found'));
  }
}

function makeSaleRequest(config, saleData, cb) {
  var message = {
    url: config.serviceAddress,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'tp-application-id': 1234,
      'tp-application-name': 'triPOS.node',
      'tp-application-version': '1.0.0',
      'tp-authorization': 'Version='+config.tpAuthorizationVersion+', Credential='+config.tpAuthorizationCredential,
      'tp-return-logs': false
    },
    json: saleData 
  };

  createAuthHeader(message, config.tpAuthorizationCredential, config.tpAuthorizationSecret, function(err, tpAuthHeader) {
    if(err) return cb(err);
    message.headers['tp-authorization'] = tpAuthHeader;
    request(message, function(err, response, body) {
      return cb(err, body);
    });
  });
}

function createAuthHeader(message, developerKey, developerSecret, cb) {
  var algorithm = 'tp-hmac-md5';
  var nonce = uuid.v4();
  var requestDate = new Date().toISOString();
  var parsedUrl = url.parse(message.url);
  var canonicalUri = parsedUrl.path;
  var canonicalQueryStr = parsedUrl.query;
  var method = message.method;
  var bodyHash = getBodyHash(JSON.stringify(message.json));

  // 1. Get the header information
  var canonicalHeaderInfo = getCanonicalHeaderInfo(message.headers);
  var canonicalSignedHeaders = canonicalHeaderInfo.canonicalSignedHeaders;
  var canonicalHeaderStr = canonicalHeaderInfo.canonicalHeaderStr;

  // 2. Calculate the request hash
  var requestHash = getCanonicalRequestHash(
    method, canonicalUri, canonicalQueryStr, canonicalHeaderStr, canonicalSignedHeaders, bodyHash
  );

  // 3. Get the signature hash
  var keySignatureHash = getKeySignatureHash(requestDate, nonce + developerSecret);

  var unhashedSignature = algorithm.toUpperCase() + '\n' + requestDate + '\n' + developerKey + '\n' + requestHash;

  // 4. Get the actual auth signature
  var signature = getKeySignatureHash(keySignatureHash, unhashedSignature);

  // 5. Create the auth header
  var tpAuthorization = [
    'Version=1.0', 
    'Algorithm='+algorithm.toUpperCase(), 
    'Credential='+developerKey, 
    'SignedHeaders='+canonicalSignedHeaders, 
    'Nonce='+nonce,
    'RequestDate='+requestDate,
    'Signature='+signature
  ].join(',');

  return cb(null, tpAuthorization);
}

function getBodyHash(body) {
  return crypto.createHash('md5').update(
    new Buffer(body, 'utf8')
  ).digest('hex');
}

function getCanonicalHeaderInfo(headers) {
  var canonicalSignedHeaders = [];
  var canonicalHeaders = {};
  var uniqHeaders = [];
  _.each(headers, function(v, k) {
    if(k.indexOf('tp-') === 0) return;
    canonicalSignedHeaders.push(k);
    if(uniqHeaders.indexOf(k) === -1) {
      // uniq
      uniqHeaders.push(k);
      var headerHolder = {k: [v]};
      canonicalHeaders[k] = [v];
    } else {
      // not uniq
      canonicalHeaders[k].push(v);
    }
  });
  canonicalSignedHeaders = canonicalSignedHeaders.sort().join(';');

  //each canonicalHeader is its own line in a multiline string
  var canonicalHeaderStr = '';
  var canonicalHeaderArray = [];
  _.each(canonicalHeaders, function(v, k) {
    canonicalHeaderArray.push(k+':'+v.join(', '));
  });

  canonicalHeaderStr = canonicalHeaderArray.sort().join('\n');

  return {
    canonicalSignedHeaders: canonicalSignedHeaders,
    canonicalHeaderStr: canonicalHeaderStr
  }
}

function getCanonicalRequestHash(method, uri, query, headerStr, signedHeaderStr, bodyHash) {
  var canonicalRequest = method + '\n';
  canonicalRequest += uri + '\n';
  if(query === null) query = '';
  canonicalRequest += query + '\n';
  canonicalRequest += headerStr + '\n';
  canonicalRequest += signedHeaderStr + '\n';
  canonicalRequest += bodyHash;

  return crypto.createHash('md5').update(
    new Buffer(canonicalRequest, 'utf8')
  ).digest('hex');
}

function getKeySignatureHash(key, data) {
  return crypto.createHmac(
    'md5',
    new Buffer(key, 'utf8')
  ).update(
    new Buffer(data, 'utf8')
  ).digest('hex');
}

exports.getAuthFromConfig = getAuthFromConfig;
exports.makeSaleRequest = makeSaleRequest;
