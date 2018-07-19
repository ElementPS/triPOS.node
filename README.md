# triPOS.node

<a href="https://developer.vantiv.com/?utm_campaign=githubcta&utm_medium=hyperlink&utm_source=github&utm_content=gotquestions">Got questions? Connect with our experts on Worldpay ONE.</a>

<a href="https://developer.vantiv.com/?utm_campaign=githubcta&utm_medium=hyperlink&utm_source=github&utm_content=codingforcommerce">Are you coding for commerce? Connect with our experts on Worldpay ONE.</a>

* Questions?  certification@elementps.com
* **Feature request?** Open an issue.
* Feel like **contributing**?  Submit a pull request.

## Overview

This repository demonstrates an integration to the triPOS product using the Node.js programming language.  The application is very simple and allows a user to populate a hard coded credit sale request in either JSON format.  The user may then send that request to triPOS for further processing.

![triPOS.node](https://github.com/ElementPS/triPOS.node/blob/master/screenshot1.png)

![triPOS.node](https://github.com/ElementPS/triPOS.node/blob/master/screenshot2.png)

## Prerequisites

Please contact your Integration Analyst for any questions about the below prerequisites.

* After you clone this repository run `npm install` from the root of the cloned directory
* Register and download the triPOS application: https://mft.elementps.com/backend/plugin/Registration/ (once activated, login at https://mft.elementps.com)
* Create Express test account: http://www.elementps.com/Resources/Create-a-Test-Account
* Install and configure triPOS
* Optionally install a hardware peripheral and obtain test cards (but you can be up and running without hardware for testing purposes)
* Currently triPOS is supported on Windows 7

## Documentation/Troubleshooting

* To view the triPOS embedded API documentation point your favorite browser to:  http://localhost:8080/help/ (for a default install).
* Ensure your node server is running `node index.js` then visit `http://localhost:3000/` to view the running application.
* In addition to the help documentation above triPOS writes information to a series of log files located at:  C:\Program Files (x86)\Vantiv\triPOS Service\Logs (for a default install).

## Step 1: Generate a request package

This example shows the JSON request.  Also notice that the value in laneId is 9999.  This is the 'null' laneId meaning a transaction will flow through the system without requiring hardware.  All lanes are configured in the triPOS.config file located at:  C:\Program Files (x86)\Vantiv\triPOS Service (if you kept the default installation directory).  If you modify this file make sure to restart the triPOS.NET service in the Services app to read in your latest triPOS.config changes.

```
{
    "address": {
        "BillingAddress1": "123 Sample Stree",
        "BillingAddress2": "Suite 101",
        "BillingCity": "Chandler",
        "BillingPostalCode": "85224",
        "BillingState": "AZ"
    },
    "cashbackAmount": 0,
    "confenienceFeeAmount": 0,
    "emvFallbackReason": "None",
    "tipAmount": 0,
    "clerkNumber": "Clerk101",
    "configuration": {
        "allowPartialApprovals": false,
        "checkForDuplicateTransactions": true,
        "currencyCode": "Usd",
        "marketCode": "Retail"
    },
    "laneId": 9999,
    "referenceNumber": "Ref000001",
    "shiftId": "ShiftA",
    "ticketNumber": "T0000001"
}
```

## Step 2: Create message headers

The tp-authorization header below is only useful while testing as the full set of header information is not provided.  This example will be updated with that information in a future release.  For now refer to the integration guide for more information on constructing the headers needed for a production environment. To see an example, look in `tripos.js`.

```
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
```

## Step 3: Send request to triPOS

Use any http library to send a request to triPOS which is listening on a local address:  http://localhost:8080/api/v1/sale (if you kept the install default).

```
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
```

## Step 4: Receive response from triPOS

```
{
    "cashbackAmount": 0,
    "debitSurchargeAmount": 0,
    "approvedAmount": 0,
    "convenienceFeeAmount": 0,
    "subTotalAmount": 0,
    "tipAmount": 0,
    "accountNumber": "************6781",
    "binValue": "400300",
    "cardHolderName": "GLOBAL PAYMENTS TEST CARD/",
    "cardLogo": "Visa",
    "currencyCode": "Usd",
    "entryMode": "Swiped",
    "expirationYear": "15",
    "expirationMonth": "12",
    "paymentType": "Credit",
    "pinVerified": false,
    "signature": {
        "data": "** Removed ** ",
        "format": "PointsBigEndian",
        "statusCode": "SignaturePresent"
    },
    "terminalId": "0000009999",
    "totalAmount": 0,
    "approvalNumber": "000019",
    "isApproved": true,
    "_processor": {
        "processorLogs": [
            "** Removed **"
        ],
        "processorRawResponse": "** Removed **",
        "processorReferenceNumber": "Ref000001",
        "processorRequestFailed": false,
        "processorRequestWasApproved": true,
        "processorResponseCode": "Approved",
        "processorResponseMessage": "Approved",
        "expressResponseCode": "0",
        "expressResponseMessage": "Approved",
        "hostResponseCode": "000",
        "hostResponseMessage": "AP",
        "logs": [
            "ExpressResponseCode: ** Removed **"
        ],
        "rawResponse": "** Removed **"
    },
    "statusCode": "Approved",
    "transactionDateTime": "2016-04-18T11:19:56.0000000-07:00",
    "transactionId": "2006806685",
    "merchantId": "3928907",
    "_errors": [],
    "_hasErrors": false,
    "_links": [
        {
            "href": "http://localhost:8080/api/v1/return/2006806685/credit",
            "method": "POST",
            "rel": "return"
        },
        {
            "href": "http://localhost:8080/api/v1/reversal/2006806685/credit",
            "method": "POST",
            "rel": "reversal"
        },
        {
            "href": "http://localhost:8080/api/v1/void/2006806685",
            "method": "POST",
            "rel": "void"
        }
    ],
    "_logs": [],
    "_type": "saleResponse",
    "_warnings": []
}
```

`Now you can use the JSON Response as necessary`


#### © 2018 Worldpay, LLC and/or its affiliates. All rights reserved.

Disclaimer:
This software and all specifications and documentation contained herein or provided to you hereunder (the "Software") are provided free of charge strictly on an "AS IS" basis. No representations or warranties are expressed or implied, including, but not limited to, warranties of suitability, quality, merchantability, or fitness for a particular purpose (irrespective of any course of dealing, custom or usage of trade), and all such warranties are expressly and specifically disclaimed. Element Payment Services, Inc., a Vantiv company, shall have no liability or responsibility to you nor any other person or entity with respect to any liability, loss, or damage, including lost profits whether foreseeable or not, or other obligation for any cause whatsoever, caused or alleged to be caused directly or indirectly by the Software. Use of the Software signifies agreement with this disclaimer notice.
