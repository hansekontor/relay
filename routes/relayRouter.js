// All main relay routes

const express = require('express');
const router = express.Router();

const { getPaymentRequest } = require('../controllers/relayController');

router.get('/', getPaymentRequest);

module.exports = router;