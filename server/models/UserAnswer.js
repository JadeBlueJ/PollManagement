// models/Question.js
const Sequelize = require("sequelize");
const sequelize = require("../configs/db.connection");

const UserAnswer = sequelize.define('UserAnswer', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
  });

module.exports = UserAnswer;