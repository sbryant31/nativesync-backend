'use strict'
var Models = require('../../models');
let Service = Models.Service;
var async = require('asyncawait/async');
var await = require('asyncawait/await');

module.exports = (app, helpers) => {
  app.get('/services', async((req, res) => {
    let services = await(Service.findAll({order: 'name'}))
    return res.json({services: services});
  }));

 app.post('/services', helpers.checkauth('user'), function(req, res) {
    let result;
    if (req.body.id) {
      await(Service.update(req.body, {where: {id: req.body.id}}))
      result = await(Service.findById(req.body.id));
    } else {
      result = await(Service.create(req.body))
    }
    return res.json(result);
  });

 app.post('/services/upsert', helpers.checkauth('user'), function(req, res) {
    let result;
    let service = req.body.service;
    if (service.organization_id && service.organization_id != req.user.org.id) {
      return res.status(401).send('Invalid permissions to edit this service')
    }
    service.organization_id = req.user.org.id
    delete service['ServiceAuths'];
    delete service['ServiceDefinitions'];
    let serviceAuths = req.body.serviceAuths;
    let serviceDefinitions = req.body.serviceDefinitions;

    try {
      if (service.id) {
        await(Service.update(service, {where: {id: service.id}}))
        service = await(Service.findById(service.id));
      } else {
        service = await(Service.create(service))
      }

      // service auths and definitions can't be removed by users because this would cause
      // nightmarish scenarios
      console.log('setting service auths', serviceAuths);
      for (let serviceAuth of serviceAuths) {
        serviceAuth.service_id = service.id;
        if (serviceAuth.id) {
          await(Models.ServiceAuth.update(serviceAuth, {where: {id: serviceAuth.id}}));
        } else {
          await(Models.ServiceAuth.create(serviceAuth));
        }
      }

      console.log('setting service definitions', serviceDefinitions);
      for (let serviceDefinition of serviceDefinitions) {
        serviceDefinition.service_id = service.id;
        if (serviceDefinition.id) {
          await(Models.ServiceDefinition.update(serviceDefinition, {where: {id: serviceDefinition.id}}));
        } else {
          await(Models.ServiceDefinition.create(serviceDefinition));
        }
      }

      serviceAuths = await(service.getServiceAuths());
      serviceDefinitions = await(service.getServiceDefinitions());
      console.log('upsert service', service, serviceAuths, serviceDefinitions);
      return res.json({
        service: service,
        serviceAuths: serviceAuths,
        serviceDefinitions: serviceDefinitions
      });
    } catch(e) {
      console.log('error', e);
      return res.status(500).send(e);
    }
  });

  app.get('/service/:id', helpers.checkauth('user'), (req, res) => {
    var service = await(Service.findById(req.params.id, {
      include: [
        {model: Models.ServiceAuth, as: 'ServiceAuths'},
        {model: Models.ServiceDefinition, as: 'ServiceDefinitions'}
      ]
    }))
    return res.json({
      service: service,
      serviceAuths: service.ServiceAuths,
      serviceDefinitions: service.ServiceDefinitions
    });
  });

}
