// Controller for docs
const showdown = require('showdown')
const converter = new showdown.Converter({
    tables: true,
    completeHTMLDocument: true,
})
const path = require("path")
const fs = require('fs')

module.exports = async (req, res) => {
    const url = '../README.md'
    const contents = fs.readFileSync(path.resolve(__dirname, url), 'utf8')
    const html = converter.makeHtml(contents)
    res.end(html)
}