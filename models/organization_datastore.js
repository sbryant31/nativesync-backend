'use strict';

let postgres = require('../drivers/postgres');
let Sequelize = require('sequelize')

var OrganizationDatastore = postgres.define('organization_datastore', {
  id: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  organization_id: {
    type: Sequelize.BIGINT
  },
  key: {
    type: Sequelize.STRING
  },
  value: {
    type: Sequelize.JSONB
  },
  createdAt: {
    type: Sequelize.DATE
  },
  updatedAt: {
    type: Sequelize.DATE
  }
}, {
  freezeTableName: true,
  indexes: [{fields: ['organization_id', 'key'], unique: true}]
});

module.exports = OrganizationDatastore
