// global.CONFIG = require("./configs/config");
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const morgan = require("./utils/morgan");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const sequelize = require("./configs/db.connection.js");
const Poll = require("./models/Poll")
const Question = require("./models/Question")
const Option = require("./models/Option")
const User= require("./models/User")

const UserAnswer= require("./models/UserAnswer.js")
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));
app.use(morgan);
app.use(cors());

app.use(require("./routes/common.js"));
app.use(require("./routes/user.js"));
app.use(require("./routes/analytics.js"));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match
    // the domain you will make the request from
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
        );
        next();
    });

// Define associations
Poll.hasMany(Question);
Question.belongsTo(Poll);
Option.belongsTo(Question);
Question.hasMany(Option);

User.hasMany(UserAnswer);
UserAnswer.belongsTo(User);

Poll.hasMany(UserAnswer);
UserAnswer.belongsTo(Poll);

Question.hasMany(UserAnswer);
UserAnswer.belongsTo(Question);

Option.hasMany(UserAnswer);
UserAnswer.belongsTo(Option);
// Sync the models with the database (create tables if they don't exist)
// {alter:true}
sequelize.sync()
  .then(() => {
    console.log('Database synced successfully.');
    const server = http.createServer(app);
    server.listen(port, () =>
      console.log(`Server is up and running on port ${port}`)
    );
    // Start your server or perform other operations here
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });


