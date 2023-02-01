// Controller for index

module.exports = {
    getIndexData(req, res) {
      /*res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ a: 1 }));
      return res */
      return res.render('index', { title: 'Express Template' });
    },
  };