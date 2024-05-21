import { Accounts } from "./BrokerAPI/Accounts";

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const accountsRoute = require("./modules/accounts/router/accounts.router");

const app = express();
const port = 3000;

const main = async () => {
  const a = await Accounts.getAccountsPositions();
  console.log(JSON.stringify(a));

  try {
    // settings
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cors({ origin: "*" }));

    //routes
    app.use("/accounts", accountsRoute);


    // listen
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
};
main();

module.exports = app;


