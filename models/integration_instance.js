'use strict';

let postgres = require('../drivers/postgres');
let Sequelize = require('sequelize')
// TODO: need an "active" and "inactive" boolean
var IntegrationInstance = postgres.define('integration_instance', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true
  },
  integration_id: {
    type: Sequelize.BIGINT
  },
  client_id: {
    type: Sequelize.BIGINT
  },
  scheduling_info: {
    type: Sequelize.JSON
  },
  inputs: {
    type: Sequelize.JSON
  },
  last_run: {
    type: Sequelize.DATE
  },
  active: {
    type: Sequelize.BOOLEAN
  },
  createdAt: {
    type: Sequelize.DATE
  },
  updatedAt: {
    type: Sequelize.DATE
  }
}, {
  freezeTableName: true
});

module.exports = IntegrationInstance