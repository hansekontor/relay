const axios = require('axios');
const { getCompactQuery, validateQueryTypes, validateHeader } = require('../scripts/relay.js');
require('dotenv').config();


function isUptimeCheck(req) {
    const expQuery = "uptime";
    if (req.query.test === expQuery) {
        return true;
    } else {
        return false;
    }
}

function answerUptimeChecks(res) {
    return res.status(200).send("success");
}

function answerInvalidHeaders(res) {
    const errorMsg = "Permission Denied: Provide valid authentication";
    return res.status(401).send(errorMsg);
}

function answerTypeErrors(typeErrorMsg, res) {
    res.statusMessage = "Bad Request";
    return res.status(400).send(typeErrorMsg);
}

module.exports = {
    async getPaymentRequest(req,res) {
        try {
            // answer custom requests
            if (isUptimeCheck(req)) {
                return answerUptimeChecks(res);
            }

            // validate header and extract fee data
            const { isValidHeader, fee, feeType, decodedChain } = await validateHeader(req);
            if (!isValidHeader) {
                return answerInvalidHeaders(res);
            }

            // validate query address & amount
            const { validTypes, isSingleRecipient, typeErrorMsg } = await validateQueryTypes(req.query);
            if (!validTypes) {
                return answerTypeErrors(typeErrorMsg, res);
            }

            // add compact amounts
            const newQuery = getCompactQuery(req.query, isSingleRecipient, fee, feeType);
            
            // send GET request to upstream server 
            const url = process.env.URL_UPSTREAM;
            const options = {
                params: newQuery
            };
            const jwtUpstream = process.env.JWT_UPSTREAM;
            if (jwtUpstream) {
            options.headers = {
                'Authorization': `Bearer ${jwtUpstream}`
            };
            }
            const result = await axios.get(url, options);

            // relay the response
            const isRedirect = result.request?._redirectable?._isRedirect;
            if (isRedirect) {
                res.redirect(result.request._redirectable._currentUrl);
            } else {
                res.send(result.data);
            }
        } catch (error) {
            console.error("server error:", error.response?.data + ";", "axios error:", error.request?.cause + ";", "other error:", error.message +";"); 
            const statusMsg = error.response?.statusText;
            const status = error.response?.status || 500;
            const data = error.response?.data

            res.statusMessage = statusMsg;
            res.status(status).send(data);
        }
    }
}
