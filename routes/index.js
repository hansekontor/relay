// Main router entry point, sets up all route modules

const express = require('express')
const router = express.Router()

const relayRouter = require('./relayRouter')

router.use('/v1/', relayRouter)

module.exports = router
