# Readme for the Poll Management App

### Details: Backend API for a Poll Management app, based on mySQL and Node.js

### Create a database in mySQL workbench using: CREATE DATABASE IF NOT EXISTS <your_database_name>
### Use it with: USE <your_database_name>

### Add a db.connection.js file in the /configs folder with the following details:

[
const { Sequelize } = require("sequelize");

// Replace 'your_database_name', 'your_username', and 'your_password' with your actual mySQL database configuration
const sequelize = new Sequelize("your_database", "your_username", "your_password", {
host: "localhost",
dialect: "mysql",
});
module.exports = sequelize;
]

## Database Schema

### User Table

| Field        | Type    | Constraints                 |
| ------------ | ------- | --------------------------- |
| id           | INTEGER | PRIMARY KEY, AUTO_INCREMENT |
| email        | STRING  | UNIQUE, NOT NULL            |
| totalRewards | INTEGER | DEFAULT 0                   |

### Poll Table

| Field      | Type     | Constraints                 |
| ---------- | -------- | --------------------------- |
| id         | INTEGER  | PRIMARY KEY, AUTO_INCREMENT |
| title      | STRING   | NOT NULL                    |
| category   | STRING   | NOT NULL                    |
| startDate  | DATEONLY | NOT NULL                    |
| endDate    | DATEONLY | NOT NULL                    |
| minReward  | INTEGER  | NOT NULL                    |
| maxReward  | INTEGER  | NOT NULL                    |
| totalVotes | INTEGER  | DEFAULT 0                   |

### Question Table

| Field | Type    | Constraints                 |
| ----- | ------- | --------------------------- |
| id    | INTEGER | PRIMARY KEY, AUTO_INCREMENT |
| type  | ENUM    | NOT NULL                    |
| text  | STRING  | NOT NULL                    |

### Option Table

| Field | Type    | Constraints                 |
| ----- | ------- | --------------------------- |
| id    | INTEGER | PRIMARY KEY, AUTO_INCREMENT |
| text  | STRING  | NOT NULL                    |
| votes | INTEGER | DEFAULT 0                   |

### UserAnswer Table

| Field | Type    | Constraints                 |
| ----- | ------- | --------------------------- |
| id    | INTEGER | PRIMARY KEY, AUTO_INCREMENT |

### Setup instructions:

1. Setup mySql on local system
2. cd into /PollManagement/server/
3. run npm i and then nodemon start in the terminal
4. Once server is setup and running, verify the API via samples in the POSTMAN collection link below

### Postman API collection : https://elements.getpostman.com/redirect?entityId=32374927-6f3216c1-6253-43c6-99a0-09a1e4c09ba0&entityType=collection
