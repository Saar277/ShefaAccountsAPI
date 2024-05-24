"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const accounts_contoller_1 = __importDefault(require("../contoller/accounts.contoller"));
const router = express.Router();
/**
 * get all the examples
 */
router.route("/positions").get(accounts_contoller_1.default.getAccountsPositions);
router.route("/values").get(accounts_contoller_1.default.getAccountsValuesHistory);
router.route("/trades").get(accounts_contoller_1.default.getAccountsTrades);
router
    .route("/statistics/:accountName")
    .get(accounts_contoller_1.default.getAccountStatistics);
router.route("/symbols").get(accounts_contoller_1.default.getAccountsOrdersSymbols);
router.route("/names").get(accounts_contoller_1.default.getAccountsNames);
router.route("/bars/:accountName/:symbol/:timeFrame/:TimeFrameUnit").get(accounts_contoller_1.default.getBarsWithOrders);
module.exports = router;
//# sourceMappingURL=accounts.router.js.map