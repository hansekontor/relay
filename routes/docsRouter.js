// All Payment Protocol routes

const express = require('express')
const router = express.Router()

const docs = require('../controllers/docsController')

router.get('/:type', docs)
router.get('/', docs)

module.exports = router