var Promise = require('bluebird');
var async = require('asyncawait/async');
var await = require('asyncawait/await');
const vm = require('vm');
const request = require('request-promise');

class IntegrationRunner {
  constructor(client, integration, integrationInstance) {
    this.client = client;
    this.integration = integration;
    this.integrationInstance = integrationInstance;
  }

  run() {
    const nsUrl = "nativeapi.herokuapp.com";
    var deferred = Promise.defer();
    var api = {
      ns: function(action_id, input) {
        return request.post({
          url: nsUrl + "/action/" + action_id,
          json: input,
          headers: {
            'X-api-key': this.client.api_key
          }
        })
      },
      end: function(output) {
        deferred.resolve(output)
      }
    }
    let code = `(function(api) { ${this.integration.code} })()`
    console.log('running code', code);
    vm.runInNewContext(code, api);
    return deferred.promise;
  }
}

module.exports = IntegrationRunner
