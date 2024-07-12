import express = require("express");
import accountsContoller from "../contoller/accounts.contoller";

const router = express.Router();

/**
 * get all the examples
 */
router.route("/positions").get(accountsContoller.getAccountsPositions);

router.route("/positions/:accountName").get(accountsContoller.getAccountPositions);

router.route("/values").get(accountsContoller.getAccountsValuesHistory);

router
  .route("/values/:accountName")
  .get(accountsContoller.getAccountValuesHistory);

router
  .route("/values/:accountName/:startDate/:endDate")
  .get(accountsContoller.getAccountValuesHistoryInDates);

router
  .route("/pNl/:accountName/:monthOrYear")
  .get(accountsContoller.getAccountPnlInEveryMonthOrYear);

router.route("/trades").get(accountsContoller.getAccountsTrades);

router.route("/trades/:accountName").get(accountsContoller.getAccountTrades);

router
  .route("/statistics/:accountName")
  .get(accountsContoller.getAccountStatistics);

router
  .route("/statistics/:accountName/:startDate/:endDate")
  .get(accountsContoller.getAccountStatisticsInTimeRange);

router.route("/symbols").get(accountsContoller.getAccountsOrdersSymbols);

router
  .route("/symbols/:accountName")
  .get(accountsContoller.getAccountOrdersSymbols);

router.route("/names").get(accountsContoller.getAccountsNames);

router
  .route("/bars/:accountName/:symbol/:timeFrame/:TimeFrameUnit")
  .get(accountsContoller.getBarsWithOrdersAndStopLossesAndTakeProfits);

  router
  .route("/bars/:accountName/:symbol/:timeFrame/:TimeFrameUnit/:smaLength")
  .get(accountsContoller.getBarsWithOrdersWithSmaAndStopLossesAndTakeProfits); //TODO: delete it after the front use the route below

  router
  .route("/bars/withSma/:accountName/:symbol/:timeFrame/:TimeFrameUnit/:smaLength")
  .get(accountsContoller.getBarsWithOrdersWithSmaAndStopLossesAndTakeProfits);

  router
  .route("/bars/withMinMax/:accountName/:symbol/:timeFrame/:TimeFrameUnit/:rollingWindow")
  .get(accountsContoller.getBarsWithOrdersAndMinMaxPointsAndStopLossesAndTakeProfits);

module.exports = router;
