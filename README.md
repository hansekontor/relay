# Documentation

## Table of Contents

[Protocol](#protocol) <br>
[Installation](#installation) <br>
[IPN Validation](#ipn-validation)

## Protocol
Any  Relay Server in the CMPCT network should follow the protocol specified [here](https://github.com/bux-digital/documentation/blob/main/merchant-server-api.md). This means that all of the noted GET query parameters must be accepted via an API and relayed through the network. By no means shall any modification be made of the requested parameters by Relay Servers except the adding of additional outputs by adding address(es) and amount(s) to merchant_addr and amount according to syntax. Never should a Relay Server use any feature that modifies incoming properties as it removes the critical benefit of absolute trustlessness within the CMPCT Relay Network. Merchants must always be able to expect the exact amount they will receive after a BUX Auth Code payment request made by the merchant has been fulfilled. The response that a Relay Server receives by making the GET request to its upstream Relay Server must be relayed back, as is, to the client of the incoming payment request. This should also include redirections (when query parameter return_json is not used). This repository acts as a reference for a relay server using this protocol. <br>


## Installation

### 1 Requirements
* [Node.js and npm](https://nodejs.org/en/download/),

### 2 Download and Install the Repository
To obtain the Relay Server repository, run:
```bash
git clone https://github.com/hansekontor/relay
```
To install the required modules, run, while being in the root directory of the repository:
```bash
npm install
```

### 3 Customize your Server’s Settings
Create a new .env file by running:
```bash
cp sample_env .env
```
Open the .env file in an editor and customize. 
* `NODE_ENV` “development” will cause creation of an http server and extended error stacks. Set any other value for http server creation.  
* `HOSTNAME` localhost or your base URL
* `HTTP_PORT` any port, defaults to port 8000
* `HTTPS_PORT` any port, defaults to port 3000
* `DEFAULT_RATE` default fee rate that is applied if no fee via JWT is provided
* `DEFAULT_AMOUNT` default absolute amount that is applied if no amount via JWT is provided
If both default fees are set, the rate will be preferred. It is required to set one default fee.
* `JWT_ENABLED` true/false to allow use of JWT. If false, default fees will be used.
* `JWT_OPTIONAL` false/true to necessarily require the use of JWT
* `JWT_PUBKEY` public key associated with the private key that was used to create JWT that should be accepted by this relay server. Required if JWT are enabled. 
* `URL_UPSTREAM` url of your upstream Relay Server (that issued JWT to you)
* `JWT_UPSTREAM` JWT issued to you from your upstream Relay Server
* `ADDRESS_1` ecash/etoken address that will receive SHARE_1 of the fees applied by this server
* `SHARE_1` percentage in decimals (0.5 for a share of 50%) that ADDRESS_1 will receive of the total fees
Additional addresses and shares can be added by simply continuing the format used (`ADDRESS_2`, `SHARE_2`, `ADDRESS_3`, `SHARE_3`, …). 
* `SSL_PRIVKEY` absolute path leading to the privkey.pem file relating to the SSL certificate for the given HOSTNAME
* `SSL_FULLCHAIN` absolute path leading to the fullchain.pem file relating to the SSL certificate for the given HOSTNAME

If you don’t change the default settings you will launch an HTTP server on localhost:8000 that relays its incoming payment requests to `https://relay1.cmpct.org/v1`. If you want to create an HTTPS server, updating the SSL properties is necessary. The default syntax enables a quick certificate creation via [certbot](https://certbot.eff.org/instructions). Replace the domain in the SSL properties after obtaining the certificates via: 
```bash
sudo certbot certonly --standalone -d yourdomain
```

### 4 Daemonize the Application
Use 
```bash 
sudo npm start
```
to start the application. To start as standalone, you can run: 
```bash
sudo node ./bin/www
```
We recommend using a process manager like systemctl or pm2. With pm2 installed, while being in the root directory of the relay server, you can now utilize:
```bash
sudo pm2 start ./bin/www --name yourname --time
sudo pm2 logs yourname
sudo pm2 stop yourname
sudo pm2 restart yourname
```
Please read the according [documentation](https://pm2.keymetrics.io/docs/usage/quick-start/).

### 5 Test the Application
Monitor or test the status of your application by making a GET request and receiving a response with status 200. Adjust the request according to your `HOSTNAME` and port. 
```bash
curl "https://yourdomain/v1?test=uptime"
curl "localhost:8000/v1?test=uptime"
```

To ensure payment request functionality make a similar request to your server:
```bash
curl "https://yourdomain/v1?merchant_name=Example+Merchant&invoice=e7c7&order_key=7c&merchant_addr=etoken:qq20ufx3rr00ej96xa2egwggrj7247stxqpr85fvwe&amount=100&return_json=true"
```


## IPN Validation
Every Relay Operator must teach his Merchants and downstream Relays how to validate an IPN. 

Following the successful fulfillment of a payment request, an IPN is sent to the URL specified in the `ipn_url` of the initial GET request. This request must be validated by the Agent. This differs severely from legacy payment methods as third parties between the transaction participants usually guarantee trustworthiness of IPNs. With an open, permissionless network, every participant needs to validate that transactions are as intended. Please consider the following properties of the IPN [here](https://github.com/bux-digital/documentation/blob/main/merchant-server-api.md#ipn-post-data).<br>

First of all, the IP origin of the IPN should be validated as it must equal the origin of the paymentUrl (`https://pay.badger.cash/`). If validated, the IPN received could still indicate an unintended transaction as malicious actors on the network could potentially modify the transaction to their benefit. The recipient of the IPN must now compare intended transaction outputs with actual outputs. The IPN properties (custom/order_key for example) should help the merchant to identify the expected recipients and amounts for a still unfulfilled order. Actual transactions can be reviewed by requesting an eCash node with a transaction hash, as given in the `txn_id` of the IPN data. Nodes might already parse out SLP data and include it in the sent data (as below). If that is the case, Merchants do not have to validate if a transaction is a valid eToken transaction as the node has already done that. See the example below. <br>

```javascript
const axios = require('axios');
const buxDecimals = 4;

// partial ipn POST data
const ipn = {
   txn_id: "bbfc1da442c4cd5214f3eb72fd9113d12f8f0352cc74ac7948029e8adb40dda9"
};

// call to merchant database to get expected amounts and recipients based on `order_key`. (amount = 1 BUX = 10000 base units of BUX)
const expected = {
   amount: 1 * 10**buxDecimals,
   recipient: "ecash:qz92ejgtzd0wstr6qjjy6cef533635cxju8vuzeqye"
};

(async () => {
   // GET request to node
   const url = `https://ecash.badger.cash:8332/tx/${ipn.txn_id}?slp=true`;
   const result = await axios.get(url);
   const txData = result.data;

   // process node data to data format used for comparison
   const outputArray = txData.outputs.map(function(output) {
       return {
           amount: Number(output.slp?.value),
           recipient: output.address
       };
   });
  
   // compare arrays or normalize addresses before && normalize amounts
   const isIncluded = outputArray.some(output => output.amount === expected.amount && output.recipient === expected.recipient);
   console.log(isIncluded);
})();
```
Please consider the two possible address formats (`ecash`/`etoken`) when comparing. Nodes might only give you the address format with prefix `ecash`. One way to standardize addresses to one of the two formats is given below.

```javascript
const ecashaddr = require('ecashaddrjs');

// function returns address with desired prefix
function convertAddress(address, targetPrefix) {
   const { prefix, type, hash } = ecashaddr.decode(address);
   if (prefix === targetPrefix) {
       return address;
   } else {
       const convertedAddress = ecashaddr.encode(targetPrefix, type, hash);
       return convertedAddress;
   }
};

const ecashAddress = convertAddress("etoken:qz92ejgtzd0wstr6qjjy6cef533635cxjufj4q08qw", "ecash");
```

Depending on the merchant’s risk of accepting false IPNs, it might also be very helpful to keep a list of transaction hashes already used for fulfilling orders so that old transactions could not be used again. 