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
router
    .route("/positions/:accountName")
    .get(accounts_contoller_1.default.getAccountPositions);
router.route("/values").get(accounts_contoller_1.default.getAccountsValuesHistory);
router
    .route("/values/:accountName")
    .get(accounts_contoller_1.default.getAccountValuesHistory);
router
    .route("/values/:accountName/:startDate/:endDate")
    .get(accounts_contoller_1.default.getAccountValuesHistoryInDates);
router
    .route("/pNl/:accountName/:monthOrYearOrDay")
    .get(accounts_contoller_1.default.getAccountPnlInEveryMonthOrYearOrDay);
router.route("/trades").get(accounts_contoller_1.default.getAccountsTrades);
router.route("/trades/:accountName").get(accounts_contoller_1.default.getAccountTrades);
router.route("/statistics").get(accounts_contoller_1.default.getAccountsStatistics);
router
    .route("/statistics/:accountName")
    .get(accounts_contoller_1.default.getAccountStatistics);
router
    .route("/statistics/:accountName/:symbol")
    .get(accounts_contoller_1.default.getAccountStatisticsForSymbol);
router
    .route("/statisticsPerSymbol/:accountName")
    .get(accounts_contoller_1.default.getAccountStatisticsPerSymbol);
router
    .route("/statistics/:accountName/:startDate/:endDate")
    .get(accounts_contoller_1.default.getAccountStatisticsInTimeRange);
router.route("/symbols").get(accounts_contoller_1.default.getAccountsOrdersSymbols);
router
    .route("/symbols/:accountName")
    .get(accounts_contoller_1.default.getAccountOrdersSymbols);
router.route("/names").get(accounts_contoller_1.default.getAccountsNames);
router
    .route("/bars/:accountName/:symbol/:timeFrame/:TimeFrameUnit")
    .get(accounts_contoller_1.default.getBarsWithOrdersAndStopLossesAndTakeProfits);
router
    .route("/bars/:accountName/:symbol/:timeFrame/:TimeFrameUnit/:smaLength")
    .get(accounts_contoller_1.default.getBarsWithOrdersWithSmaAndStopLossesAndTakeProfits); //TODO: delete it after the front use the route below
router
    .route("/bars/withSma/:accountName/:symbol/:timeFrame/:TimeFrameUnit/:startMilliseconds/:smaLength")
    .get(accounts_contoller_1.default.getBarsWithOrdersWithSmaAndStopLossesAndTakeProfits);
router
    .route("/bars/withMinMax/:accountName/:symbol/:timeFrame/:TimeFrameUnit/:startMilliseconds/:rollingWindow")
    .get(accounts_contoller_1.default.getBarsWithOrdersAndMinMaxPointsAndStopLossesAndTakeProfits);
router.route("/orders").get(accounts_contoller_1.default.getAllOrders);
router.route("/orders/:accountName").get(accounts_contoller_1.default.getAccountAllOrders);
router.route("/openOrders/:accountName").get(accounts_contoller_1.default.getAccountAllOpenOrders);
module.exports = router;
//# sourceMappingURL=accounts.router.js.map