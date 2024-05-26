import express = require("express");
import accountsContoller from "../contoller/accounts.contoller";

const router = express.Router();

/**
 * get all the examples
 */
router.route("/positions").get(accountsContoller.getAccountsPositions);

router.route("/values").get(accountsContoller.getAccountsValuesHistory);

router.route("/values/:accountName").get(accountsContoller.getAccountValuesHistory);

router.route("/values/:accountName/:startDate/:endDate").get(accountsContoller.getAccountValuesHistoryInDates);

router.route("/trades").get(accountsContoller.getAccountsTrades);

router.route("/trades/:accountName").get(accountsContoller.getAccountTrades);

router
  .route("/statistics/:accountName")
  .get(accountsContoller.getAccountStatistics);

router.route("/symbols").get(accountsContoller.getAccountsOrdersSymbols);

router.route("/names").get(accountsContoller.getAccountsNames);

router.route("/bars/:accountName/:symbol/:timeFrame/:TimeFrameUnit").get(accountsContoller.getBarsWithOrders);

module.exports = router;
