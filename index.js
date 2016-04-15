'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser')
var Config = require('./lib/Config.js');
var Address = require('./lib/Address.js');
var SaleRequest = require('./lib/SaleRequest');
var triPos = require('./lib/tripos');

app.set('view engine', 'jade'); 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
  var address = new Address({});
  var saleRequest = new SaleRequest({
    address: address,
    transactionAmoung: 3.25,
    configuration: {
      allowPartialApprovals: false,
      checkForDuplicateTransactions: true,
      currencyCode: "Usd",
      marketCode: "Retail"
    }
  });
  return renderResponse(
    '', 
    JSON.stringify(saleRequest.toJSON(), undefined, 4),
    null,
    res
  );
});

app.post('/', function(req, res) {
  var config = new Config(
    "C:\\Program Files (x86)\\Vantiv\\triPOS Service\\triPOS.config",
    "http://localhost:8080/api/v1/sale", 
    "1.0"
  );

  triPos.getAuthFromConfig(config.pathToConfig, function(err, credential) {
    if(err) {
      return renderResponse(err, req.body.request, null, res);
    }

    config.tpAuthorizationCredential = credential.developerKey;
    config.tpAuthorizationSecret = credential.developerSecret;

    try {
      req.body.request = JSON.parse(req.body.request)
    } catch(e) {
      return renderResponse(new Error('Failed to parse request JSON'), req.body.request, null, res);
    }

    triPos.makeSaleRequest(config, req.body.request, function(err, saleResponse) {
      return renderResponse(
        err, 
        JSON.stringify(req.body.request, undefined, 4), 
        JSON.stringify(saleResponse, undefined, 4), 
        res
      );
    });
  });
});

function renderResponse(err, reqCode, respCode, res) {
  res.render('index', {
    title: 'triPOS.node',
    message: 'triPOS.node',
    requestCode: reqCode,
    responseCode: respCode 
  });
}

app.listen(3000, function () {
  console.log('triPos Sample running on localhost port 3000');
});

