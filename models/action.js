'use strict';

var _ = require('underscore');
let postgres = require('../drivers/postgres');
let Sequelize = require('sequelize')
var await = require('asyncawait/await');

// NOTE: if adding/removing fields from action make sure to add them to the cloneFrom function

var Action = postgres.define('action', {
  id: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  service_id: {
    type: Sequelize.BIGINT
  },
  organization_id: {
    type: Sequelize.BIGINT
  },
  copied_from_id: {
    type: Sequelize.BIGINT
  },
  title: {
    type: Sequelize.STRING
  },
  api_version: {
    type: Sequelize.STRING
  },
  schemes: {
    type: Sequelize.JSON
  },
  headers: {
    type: Sequelize.JSON
  },
  query: {
    type: Sequelize.JSON
  },
  host: {
    type: Sequelize.STRING
  },
  path: {
    type: Sequelize.STRING
  },
  method: {
    type: Sequelize.STRING
  },
  creator_user_id: {
    type: Sequelize.BIGINT
  },
  service_name: {
    type: Sequelize.STRING,
  },
  organization_name: {
    type: Sequelize.STRING,
  },
  function_name: {
    type: Sequelize.STRING,
  },
  type: {
    type: Sequelize.STRING
  },
  input_body: {
    type: Sequelize.JSON
  },
  output_body: {
    type: Sequelize.JSON
  },
  version: {
    type: Sequelize.STRING
  },
  description: {
    type: Sequelize.TEXT
  },
  input: {
    type: Sequelize.JSON
  },
  output: {
    type: Sequelize.JSON
  },
  official: {
    type: Sequelize.BOOLEAN
  },
}, {
  freezeTableName: true,
  indexes: [{fields: ['service_id']}, {fields: ['service_name', 'function_name'], unique: true}, {fields: ['organization_id']}]
});

Action.cloneFrom = function(oldAction, user, org) {
	let newAction = {};
	newAction.name = `${newAction.name} (copy)`
	newAction.copied_from_id = oldAction.id;
  var cloneFields =  [
    'service_id', 'schemes', 'headers', 'query', 'host', 'path', 'method',
		'service_name', 'function_name', 'type', 'version', 'description', 'input',
		'title', 'api_version', 'input_body', 'output_body', 'output', 'organization_name'
  ];
	_.each(cloneFields, (field) =>  {
		newAction[field] = oldAction[field];
	})
	newAction.creator_user_id = user.id;
	newAction.organization_id = org.id;
	console.log('cloning action', newAction);
  newAction = await(Action.create(newAction));
  let oldServiceAuths = await(oldAction.getServiceAuths());
  await(newAction.setServiceAuths(oldServiceAuths));
	return newAction;
}

module.exports = Action
