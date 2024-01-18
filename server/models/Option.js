// models/Question.js
const Sequelize = require("sequelize");
const sequelize = require("../configs/db.connection");

const Option = sequelize.define("Option", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  text: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  votes:{
    type: Sequelize.INTEGER,
    defaultValue:0,
  }
  // You can add more question-related fields as needed
});

module.exports = Option;