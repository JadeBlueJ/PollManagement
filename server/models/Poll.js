const Sequelize = require("sequelize");
const sequelize = require("../configs/db.connection");
// models/Poll.js
const Poll = sequelize.define("Poll", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  category: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  startDate: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  endDate: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  minReward: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  maxReward: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  totalVotes:{
    type:Sequelize.INTEGER,
    defaultValue:0,
  }
});

module.exports = Poll;
