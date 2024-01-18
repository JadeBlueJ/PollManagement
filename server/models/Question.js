// models/Question.js
const Sequelize = require("sequelize");
const sequelize = require("../configs/db.connection");

const Question = sequelize.define("Question", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  type: {
    type: Sequelize.ENUM("single", "multiple"),
    allowNull: false,
  },
  text: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

module.exports = Question;