## Installation

### Requirements

* [Node.js and NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

### Getting Started

In the root directory of this project (the directory containing this README file) run

```bash
npm install
```

This will install the required modules. Then create a new .env file by running

```bash
cp sample_env .env
```
Change the values in the .env file to reflect your settings. Especially set the SSL certificates to reflect your domain. If you want to run a localhost http server, please change the settings in bin/www accordingly.

To start the application run

```bash
sudo npm start
```

To start the application as a standalone daemon, run 

```bash
sudo node ./bin/www
```

With the application started, you can make a GET request to `https://yourdomain/v1?test=uptime` to receive a response with status 200.
