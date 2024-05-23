import { Accounts } from "./BrokerAPI/Accounts";

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const accountsRoute = require("./modules/accounts/router/accounts.router");
import { Request, Response } from "express";

const app = express();
const port = 3000;

const main = async () => {
  try {
    // settings
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cors({ origin: "*" }));

    //routes
    app.use("/accounts", accountsRoute);

    app.get('/', (req: Request, res: Response) => {
      return res.status(200).send('Express Typescript on Vercel')
    })
  
    
    app.get('/ping', (req: Request, res: Response) => {
      return res.status(200).send('pong 🏓')
    })


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
