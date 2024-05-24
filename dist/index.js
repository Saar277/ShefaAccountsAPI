"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const accountsRoute = require("./modules/accounts/router/accounts.router");
const app = express();
const port = 3000;
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // settings
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(cors({ origin: "*" }));
        //routes
        app.use("/accounts", accountsRoute);
        app.get('/', (req, res) => {
            return res.status(200).send('Express Typescript on Vercel - working');
        });
        // listen
        app.listen(port, () => {
            console.log(`Example app listening on port ${port}`);
        });
    }
    catch (error) {
        console.log(error);
    }
});
main();
module.exports = app;
//# sourceMappingURL=index.js.map