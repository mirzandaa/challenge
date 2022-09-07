'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    var userList = [];
    for (let i = 1; i < 5; i++){
      userList.push({
        name: "name" + i,
        address: "Jakarta No. " + i,
        phone: ("0" + Math.random()*i*1000).replace(".","").substring(0,11),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: i
      })
    }
    return queryInterface.bulkInsert('UserGameBiodata', userList);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    queryInterface.bulkDelete('UserGameBiodata', null, {})
  }
};
