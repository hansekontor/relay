# Express Template

An express server template with WebSocket (wss:), Swagger UI, and webhook worker support (via Bee Queue).

## Installation

### Requirements

* [Node.js and NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
* [Redis installed and running](https://redis.io/docs/getting-started/) on your local machine (for Bee Queue support).

### Getting Started

In the root directory of this project (the directory containing this README file) run

```bash
npm install
```

This will install the required modules. Then create a new .env file by running

```bash
cp sample_env .env
```
Change the values in the .env file to reflect your settings. You will need to replace the X509 certificate and key values to run on your domain.

To start the application (in developer mode) using nodemon run

```bash
sudo npm start
```

To start the application as a standalone daemon, run 

```bash
sudo node ./bin/www
```

With the application started, you can visit `http://yourdomain/docs` to see this README file.

## API Documentation

Documentation is available as a Swagger endpoint by visiting `http://yourdomain/api-docs` when server is running.
