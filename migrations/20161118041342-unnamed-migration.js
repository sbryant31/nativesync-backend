'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.createTable('client_auth', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      client_id: {
        type: Sequelize.BIGINT
      },
      service_id: {
        type: Sequelize.BIGINT
      },
      service_auth_id: {
        type: Sequelize.BIGINT
      },
      value: {
        type: Sequelize.JSON
      },
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      }
    });
  },

  down: function (queryInterface, Sequelize) {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
