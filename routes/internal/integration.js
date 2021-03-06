'use strict'
const Models = require('../../models');
const Services = require('../../services');
const IntegrationInstance = Models.IntegrationInstance;
const Integration = Models.Integration;
const IntegrationCode = Models.IntegrationCode;
const _ = require('underscore');
const IntegrationRunner = require('../../services/integration_runner');
const async = require('asyncawait/async')
const await = require('asyncawait/await')
const CodeRunner = Services.CodeRunner;
var Blockly = require('node-blockly');

module.exports = (app, helpers) => {

  app.post('/integrations/test', helpers.checkauth('user'), function(req, res) {
    let integrationCode = await(IntegrationCode.findOne({integration_id: req.body.id}));
    let organization = req.user.org;
    let input = req.body.input;
    var codeRunner = new CodeRunner(organization, integrationCode.code, {input: input});
    let output = await(codeRunner.run({loggingEnabled: true}));
    return res.json(output);
  });

  app.post('/integration_instance/:id/run', helpers.checkauth('user'), (req, res) => {
    console.log('params', req.params);
    let integrationInstance = await(IntegrationInstance.findById(req.params.id));
    let integration = await(integrationInstance.getIntegration());
    let integrationCode = await(integration.getIntegrationCode());
    let organization = await(integrationInstance.getOrganization());
    let output = await(new IntegrationRunner(req.user.org, integration, integrationInstance, integrationCode).run());
    return res.json(output);
  });

  app.post('/integrations', helpers.checkauth('user'), (req, res) => {
    var integration = req.body.integration;
    integration.organization_id = req.user.org.id;
    return Integration.create(integration).then((results) => {
      return res.json({success: true});
    })
  });

  app.post('/integrations/upsert', helpers.checkauth('user'), function(req, res) {
    let result;
    let integration = req.body.integration;

    let integrationCode = req.body.integrationCode;
    let services = req.body.services;
    var serviceIDs = _.pluck(services, 'id');
    let actions = req.body.actions;
    var actionIDs = _.pluck(actions, 'id');

    // translate blockly code to javascript
    if (integration.type == 'blockly') {
      try {
        var xml = Blockly.Xml.textToDom(integrationCode.blockly_xml);
      } catch (e) {
        console.log('error translating blockly code', e);
      }

      var workspace = new Blockly.Workspace();
      Blockly.Xml.domToWorkspace(xml, workspace);
      var code = Blockly.JavaScript.workspaceToCode(workspace);
      console.log('generating blockly code', code);

      integrationCode.code = code;
    }

    if (integration.organization_id && integration.organization_id != req.user.org.id) {
      return res.status(401).send('Invalid permissions to edit this integration')
    }
    integration.organization_id = req.user.org.id;
    integration.creator_user_id = req.user.id;

    try {
      if (integration.id) {
        await(Integration.update(integration, {where: {id: integration.id}}))
        integration = await(Integration.findById(integration.id));
      } else {
        integration = await(Integration.create(integration))
      }

      integrationCode.integration_id = integration.id;
      if (integrationCode.id) {
        console.log('updating integartion code', JSON.stringify(integrationCode));
        await(IntegrationCode.update(integrationCode, {where: {id: integrationCode.id}}));
      } else {
        console.log('inserting integartion code', JSON.stringify(integrationCode));
        await(IntegrationCode.create(integrationCode));
      }

      await(integration.setServices(serviceIDs));
      await(integration.setActions(actionIDs));

      return res.json({integration: integration});
    } catch(e) {
      console.log('error', e);
      return res.status(500).send(e);
    }
  });

  app.get('/integrations', helpers.checkauth('user'), (req, res) => {
    var filter = req.query;
    var integrations = await(Integration.findAll({
      where: filter,
      include: [
        {model: Models.Service, as: 'Services'},
        Models.Organization
      ],
      order: ['organization_id', 'title', ['version', 'desc']]
    }))
    return res.json({integrations: integrations});
  });

  app.get('/integration/:id', helpers.checkauth('user'), (req, res) => {
    // todo: lock this down (validate the organization_id in the filter)
    var integration = await(Integration.findById(
          req.params.id,
          {include: [
            {model: Models.Action, as: 'Actions', include: [{model: Models.ServiceAuth, as: 'ServiceAuths'}]},
            {model: Models.Service, as: 'Services', include: [{model: Models.ServiceDefinition, as: 'ServiceDefinitions'}]},
            Models.Organization
          ]}
    ));
    // NQ: includeAssociations=true causes code to be sent along with integration data
    // This is senstive info and should only be viewable by the org who wrote the code.
    if (req.query.includeAssociations && integration.organization_id != req.user.org.id) {
      return res.status(401).send('invalid permissions');
    }
    // GROSSS!!!!
    let serviceAuthIDs = {};
    let serviceAuths = [];
    for (let action of integration.Actions) {
      for (let serviceAuth of action.ServiceAuths) {
        if (!serviceAuthIDs[serviceAuth.id]) {
          serviceAuthIDs[serviceAuth.id] = serviceAuth.id;
          serviceAuths.push(serviceAuth);
        }
      }
    }
    if (integration) {
      var result = {
        integration: integration,
        services: integration.Services,
        actions: integration.Actions,
        serviceAuths: serviceAuths
      }
      if (req.query.includeAssociations) {
        let integrationCode = await(Models.IntegrationCode.findOne({where: {integration_id: integration.id}}))
        result.integrationCode = integrationCode;
      }
      return res.json(result);
    } else {
      return res.status(400).send('no such integration');
    }
  });

  app.get('/integration_instance/:id', helpers.checkauth('user'), (req, res) => {
    console.log('looking up integration instance id', req.params.id);
    var integrationInstance = await(IntegrationInstance.findById(req.params.id))
    if (integrationInstance) {
      var organization = await(Models.Organization.findById(integrationInstance.organization_id));
      let integration = await(Integration.findById(
          integrationInstance.integration_id,
          {include: [
            {model: Models.Action, as: 'Actions', include: [{model: Models.ServiceAuth, as: 'ServiceAuths'}]},
            {model: Models.Service, as: 'Services'}
          ]}
      ));
      // GROSSS!!!!
      let serviceAuthIDs = {};
      let serviceAuths = [];
      for (let action of integration.Actions) {
        for (let serviceAuth of action.ServiceAuths) {
          if (!serviceAuthIDs[serviceAuth.id]) {
            serviceAuthIDs[serviceAuth.id] = serviceAuth.id;
            serviceAuths.push(serviceAuth);
          }
        }
      }
      console.log('service auths', serviceAuths);
      return res.json({
        integration: integration,
        integrationInstance: integrationInstance,
        organization: organization,
        actions: integration.Actions,
        services: integration.Services,
        serviceAuths: serviceAuths
      });
    } else {
      return res.status(400).send('no such integration instance');
    }
  });

  app.get('/integration/:id/instances', helpers.checkauth('user'), (req, res) => {
    console.log('get instances for', req.params.id);
    var instances = await(IntegrationInstance.findAll({
      where: {integration_id: req.params.id},
      include: [Models.Organization]
    }))
    return res.json({integrationInstances: instances});
  });

  app.get('/integration_instances', helpers.checkauth('user'), (req, res) => {
    var filter = req.query;
    var results = await(IntegrationInstance.findAll({where: filter}))
    return res.json({integrationInstances: results});
  });

  app.post('/integration_instances/upsert', helpers.checkauth('user'), function(req, res) {
    let result;
    let integrationInstance = req.body.integrationInstance;
    let integration = req.body.integration;
    let organization = req.user.org;

    integrationInstance.integration_id = integration.id;
    integrationInstance.organization_id = organization.id;
    console.log('upserting instance', integrationInstance);
    try {
      if (integrationInstance.id) {
        await(IntegrationInstance.update(integrationInstance, {where: {id: integrationInstance.id}}))
        integrationInstance = await(IntegrationInstance.findById(integrationInstance.id));
      } else {
        integrationInstance = await(IntegrationInstance.create(integrationInstance))
      }
      return res.json({integrationInstance: integrationInstance, organization: organization});
    } catch(e) {
      console.log('error', e);
      return res.status(500).send(e);
    }
  });
}
