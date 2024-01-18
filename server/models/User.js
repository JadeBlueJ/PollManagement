// models/Question.js
const Sequelize = require("sequelize");
const sequelize = require("../configs/db.connection");

const User = sequelize.define("User", {
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
    default:0,
  },
  // You can add more question-related fields as needed
});

module.exports = User;