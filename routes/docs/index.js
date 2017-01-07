var async = require('asyncawait/async');
var await = require('asyncawait/await');
var express = require('express');
var fs = require('fs');

module.exports = function(app, helpers) {
  var docsRouter = express.Router();
  app.use('/docs', docsRouter);

  docsRouter.get('/swagger', async ((req, res, next) => {
    var swaggerJson = fs.readFileSync('./docs/swagger.json');
    return res.json(swaggerJson);
  }));
};
