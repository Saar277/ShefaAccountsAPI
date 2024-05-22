import express = require("express");
import accountsContoller from "../contoller/accounts.contoller";

const router = express.Router();

/**
 * get all the examples
 */
router.route("/positions").get(accountsContoller.getAccountsPositions);

router.route("/values").get(accountsContoller.getAccountsValuesHistory);

router.route("/trades").get(accountsContoller.getAccountsTrades);

module.exports = router;
