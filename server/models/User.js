// models/Question.js
const Sequelize = require("sequelize");
const sequelize = require("../configs/db.connection");

const User = sequelize.define('User', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: Sequelize.STRING,
    unique:true,
    allowNull: false,
  },
  totalRewards: {
    type: Sequelize.INTEGER,
    defaultValue:0,
  },
});

module.exports = User;