# Documentation

## Protocol
Any  Relay Server in the CMPCT network should follow the protocol specified [here](https://github.com/bux-digital/documentation/blob/main/merchant-server-api.md). This means that all of the noted GET query parameters must be accepted via an API and relayed through the network. By no means shall any modification be made of the requested parameters by Relay Servers except the adding of additional outputs by adding address(es) and amount(s) to merchant_addr and amount according to syntax. Never should a Relay Server use any feature that modifies incoming properties as it removes the critical benefit of absolute trustlessness within the CMPCT Relay Network. Merchants must always be able to expect the exact amount they will receive after a BUX Auth Code payment request made by the merchant has been fulfilled. The response that a Relay Server receives by making the GET request to its upstream Relay Server must be relayed back, as is, to the client of the incoming payment request. This should also include redirections (when query parameter return_json is not used). This repository acts as a reference for a relay server using this protocol.

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
sudo pm2 start ./bin/www --name yourname -- time
sudo pm2 logs yourname
sudo pm2 stop yourname
sudo pm2 restart yourname
```
Please read the according [documentation](https://pm2.keymetrics.io/docs/usage/quick-start/).


### 5 Test the Application
Monitor or test the status of your application by making a GET request and receiving a response with status 200. Adjust the request according to your `HOSTNAME` and port. 
```bash
curl https://yourdomain/v1?test=uptime
curl localhost:8000/v1?test=uptime
```

To ensure payment request functionality make a similar request to your server:
```bash
curl l https://yourdomain/v1?merchant_name=Example+Merchant&invoice=e7c7&order_key=7c&merchant_addr=etoken:qq20ufx3rr00ej96xa2egwggrj7247stxqpr85fvwe&amount=100&return_json=true
```
