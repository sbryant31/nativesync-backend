var checkauth = require('../helpers/checkauth')
var Action = require('../models/action')
let ClientAuth = require('../models/client_auth');
var async = require('asyncawait/async');
var await = require('asyncawait/await');

module.exports = function(app, helpers) {

  app.get('/actions', async (function(req, res) {
    let actions = await(Action.findAll())
    return res.json(actions);
  }));

  app.post('/action/:id', async (function(req, res) {
    let clientID = 1;
    let action = await(Action.findById(req.params['id']))
    let Request = require('../services/request')
    console.log('request', req.body, req.params);
    output = new Request(clientID, action).send(req.body)
    return res.json(output);
  }));
}
