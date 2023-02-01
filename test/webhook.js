/* test/webhook.js */

const models = require('../db')
const should = require('chai').should();
const Queue = require('bee-queue');
var queue = new Queue('webhook');


var Inv = require('../lib/util');


// Begin testing Webhook
describe('Webhook', function() {
    var url = 'https://postman-echo.com/post'
    var postData = {foo: 'bar'}

    it('Successfully call Postman Echo', async function() {
        let status = await Inv.callWebhook(url, postData)
        status.should.equal(200)
        //Fire job off to bee queue worker
        //Util.generateWebhookJob(postData)
    })

    it('Fail calling Postman Echobbb', async function() {
        let url = 'https://postman-echobbb.com/post'
        let postData = {foo: 'bar'}
        let status = await Inv.callWebhook(url, postData)
        status.should.equal(500)
        postData.webhookUrl = url
        //Fire job off to bee queue worker
        //Util.generateWebhookJob(postData)
    })
    

})