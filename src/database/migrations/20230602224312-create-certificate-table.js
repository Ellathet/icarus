'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('certificate', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4 },
      key: { type: Sequelize.STRING, unique: true },
      password: { type: Sequelize.STRING },

      created_at: { type: Sequelize.DATE },
      updated_at: { type: Sequelize.DATE },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('certificate');
  },
};
