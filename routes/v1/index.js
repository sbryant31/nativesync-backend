const async = require('asyncawait/async');
const await = require('asyncawait/await');
const HeaderApiKeyStrategy = require('passport-headerapikey').HeaderAPIKeyStrategy;
const config = require('config');
const express = require('express');

module.exports = function(app, helpers) {
  helpers.passport.use('client', new HeaderApiKeyStrategy({
    header: 'Api-Key', prefix: '', session: false},
    false,
    function(apikey, done) {
      console.log('authing user for client api', apikey);
      var client = await(app.Models.Client.findOne({where: {api_key: apikey}}));
      if (!client) {
        console.log('invalid API key');
        return await(done('invalid client API key', null));
      }
      console.log('found client', client);
      return await(done(null, client));
    }
  ));

  var v1Router = express.Router();
  app.use('/v1', v1Router);

  require('./me')(v1Router, helpers);
  require('./integration')(v1Router, helpers);
  require('./action')(v1Router, helpers);
};
