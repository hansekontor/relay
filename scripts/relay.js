const axios = require('axios');
const jwt = require('jsonwebtoken');
const jwa = require('jwa');
const { decodeSubjectChain } = require('relay-jwt');
require('dotenv').config();

const algorithm = 'ES256';
const ecdsa = jwa(algorithm);

function isJsonString(string) {
    try {
        JSON.parse(string);
        return true;
    } catch(e) {
        return false;
        }
}


module.exports = { 
    getTotalAmount(amount, isSingleRecipient){
        let totalAmount = 0;
        if (isSingleRecipient) {
            totalAmount += Number(amount);
        } else {
            totalAmount += JSON.parse(amount).reduce((accumulator, currentValue) => accumulator + Number(currentValue), 0);
        }

        return totalAmount;
    },
    getCompactQuery(query, totalIncomingAmount, isSingleRecipient, fee, feeType) {
        let addressArray = [], amountArray = [];    

        // parse amount and address array
        if (isSingleRecipient) {
            addressArray.push(query.merchant_addr);
            amountArray.push(query.amount); 
        } else {
            addressArray = JSON.parse(query.merchant_addr);
            amountArray = JSON.parse(query.amount);
        }

        // read recipients of fees from .env file
        let addedRecipients = [];
        for (let i = 1; i < 20;i++) {
            const address = process.env["ADDRESS_" + i];
            const share = eval(process.env["SHARE_" + i]);
            if (address && share) {
                addedRecipients.push({
                    address,
                    share
                });
            } else {
                break;
            }
        }

        // calculate total fee
        let totalFeeAmount;
        if (feeType === 0) {
            totalFeeAmount = totalIncomingAmount * fee;
        } else {
            totalFeeAmount = fee;
        }

        // divide fee across fee recipients
        for (let j = 0; j < addedRecipients.length; j++) {
            addressArray.push(addedRecipients[j].address);

            addedRecipients[j].amount = +(totalFeeAmount * addedRecipients[j].share).toFixed(4);
            amountArray.push(addedRecipients[j].amount);
        }

        // log amounts
        console.log("incoming amount: ", totalIncomingAmount, "; added amount: ", totalFeeAmount.toFixed(4), "; rate: ", (100*totalFeeAmount/totalIncomingAmount).toFixed(1)+"%");

        // finalize changes in new query
        const newQuery = query;
        newQuery.merchant_addr = JSON.stringify(addressArray);
        newQuery.amount = JSON.stringify(amountArray);

        return newQuery;
    },
    async validateQueryTypes(query) { 
        let validTypes = false;
        let isSingleRecipient = false;
        let isMultiRecipient = false;
        let typeErrorMsg;

        // check if address & amounts are provided
        if (!(query.amount && query.merchant_addr)) {
            console.log("amount/address missing");
            if (!query.amount){
                errorMsg = `Invalid amount: ${query.amount}`
            } else {
                errorMsg = `Invalid address: ${query.merchant_addr}`
            }
            return { validTypes, isSingleRecipient, errorMsg };
        } else {
            // check if single recipient
            const areJsonStrings = isJsonString(query.merchant_addr) && isJsonString(query.amount);
            const isStartingWithE = query.merchant_addr.startsWith("ecash") || query.merchant_addr.startsWith("etoken");
            const isSingleAddress = !areJsonStrings && isStartingWithE; 
            const isSingleAmount = Number.isFinite(Number(query.amount)); // check if query needs to be parsed out first
            isSingleRecipient = isSingleAddress && isSingleAmount;

            // check if multi recipient
            if (!isSingleRecipient) {
                const merchants = JSON.parse(query.merchant_addr);
                const amounts = JSON.parse(query.amount);
                const isMultiAddress = Array.isArray(merchants); 
                const isMultiAmount = Array.isArray(amounts); 
                isMultiRecipient = isMultiAddress && isMultiAmount; 
            }

            validTypes = isSingleRecipient || isMultiRecipient;
            typeErrorMsg = `Invalid type in address/amount or incompatible parameters: ${query.amount, query.merchant_addr}`;

            return { validTypes, isSingleRecipient, typeErrorMsg };
        }
    }, 
    async validateHeader(req) {    
        // set default fees & jwt settings
        const defaultRate = eval(process.env.DEFAULT_RATE);
        const defaultAmount = eval(process.env.DEFAULT_AMOUNT);    
        let fee, feeType;
        if (defaultRate) {
            fee = defaultRate;
            feeType = 0;
        } else if (defaultAmount) {
            fee = defaultAmount;
            feeType = 1;
        } else {
            console.error("no default rate/amount set");
        }
        const jwtEnabled = eval(process.env.JWT_ENABLED);
        const jwtOptional = eval(process.env.JWT_OPTIONAL);
        let isValidHeader = false;
        let isVariableFee;
    
        if (jwtEnabled) {
            const authorizationHeader = req.get('Authorization');
            if (authorizationHeader) {
                try {
                    // validate authorization header
                    console.log("jwt provided:", authorizationHeader);
                    const providedToken = authorizationHeader.slice(7);
                    const decoded = jwt.decode(providedToken);
                    const decodedChain = decodeSubjectChain(decoded.sub, ecdsa.verify);
                    const providedPubKey = decodedChain[0].publicKey;
                    const verified = jwt.verify(providedToken, providedPubKey);
                    console.log("jwt verified?", verified ? true : false, verified); 
                    const blacklistArray = JSON.parse(process.env.JWT_BLACKLIST);
                    const isBlacklisted = blacklistArray.includes(verified.aud);
                    console.log("isBlacklisted", isBlacklisted);
                    const expectedPubKey = JSON.parse(process.env.JWT_PUBKEY).publicKey;
                    const matchesPubKey = providedPubKey === expectedPubKey;
                    console.log("matches public key?", matchesPubKey);         
                    if (verified && matchesPubKey && !isBlacklisted) {
                        feeType = decodedChain[0].type;
                        isValidHeader = true;
                        if (feeType === 0) {
                            fee = +(decodedChain[0].amount / 1000).toFixed(4); 
                            console.log("fee set as rate:", fee);
                            isVariableFee = true;
                        } else if (feeType === 1) {
                            const buxDecimals = 4;
                            fee = +(decodedChain[0].amount / 10**buxDecimals).toFixed(4);
                            console.log("fee set as fixed amount:", fee);
                            isVariableFee = true;
                        }
                    } else if (jwtOptional) {
                        // invalid jwt but not required: default settings are applied
                        isValidHeader = true;
                        console.log("invalid header provided, default fee is applied");
                    }
                } catch(err) {
                    console.error(err.message);
                }
            } else if (jwtOptional) {
                // no header but not required: default settings are applied
                isValidHeader = true;
                console.log("no header provided, default fee is applied");
            }
        } else {
            // jwt disabled: default settings are applied
            isValidHeader = true;
        }

        return { isValidHeader, fee, feeType };
    }
};