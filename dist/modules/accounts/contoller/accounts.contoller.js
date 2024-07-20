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
const Accounts_1 = require("../../../BrokerAPI/Accounts");
/**
 * This class responsible to accept request and send respones.
 */
class AccountsController {
    constructor() {
        /**
         * get all the examples Dtos and return them
         * @param req - the request from the world
         * @param res - the response we return
         */
        this.getAccountsPositions = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res.status(200).send(yield Accounts_1.Accounts.getAccountsPositions());
            }
            catch (_a) {
                res.status(500).send();
            }
        });
        this.getAccountPositions = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res
                    .status(200)
                    .send(yield Accounts_1.Accounts.getAccountPositions(req.params.accountName));
            }
            catch (_b) {
                res.status(500).send();
            }
        });
        this.getAccountsValuesHistory = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res.status(200).send(yield Accounts_1.Accounts.getAccountsValuesHistory());
            }
            catch (_c) {
                res.status(500).send();
            }
        });
        this.getAccountValuesHistory = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res
                    .status(200)
                    .send(yield Accounts_1.Accounts.getAccountValuesHistory(req.params.accountName));
            }
            catch (_d) {
                res.status(500).send();
            }
        });
        this.getAccountValuesHistoryInDates = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res
                    .status(200)
                    .send(yield Accounts_1.Accounts.getAccountValuesHistoryInDatesRange(req.params.accountName, parseInt(req.params.startDate), parseInt(req.params.endDate)));
            }
            catch (_e) {
                res.status(500).send();
            }
        });
        this.getAccountPnlInEveryMonthOrYearOrDay = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res
                    .status(200)
                    .send(yield Accounts_1.Accounts.getAccountPnlInEveryMonthOrYearOrDay(req.params.accountName, req.params.monthOrYearOrDay));
            }
            catch (_f) {
                res.status(500).send();
            }
        });
        this.getAccountsTrades = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res.status(200).send(yield Accounts_1.Accounts.getClosedTrades());
            }
            catch (_g) {
                res.status(500).send();
            }
        });
        this.getAccountTrades = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res
                    .status(200)
                    .send(yield Accounts_1.Accounts.getClosedTradesForAccount(req.params.accountName));
            }
            catch (_h) {
                res.status(500).send();
            }
        });
        this.getAccountsStatistics = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res.status(200).send(yield Accounts_1.Accounts.getAccountsTradesStatistics());
            }
            catch (_j) {
                res.status(500).send();
            }
        });
        this.getAccountStatistics = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res
                    .status(200)
                    .send(yield Accounts_1.Accounts.getAccountTradesStatistics(req.params.accountName));
            }
            catch (_k) {
                res.status(500).send();
            }
        });
        this.getAccountStatisticsForSymbol = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res
                    .status(200)
                    .send(yield Accounts_1.Accounts.getAccountTradesStatisticsForSymbol(req.params.accountName, req.params.symbol));
            }
            catch (_l) {
                res.status(500).send();
            }
        });
        this.getAccountStatisticsPerSymbol = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res
                    .status(200)
                    .send(yield Accounts_1.Accounts.getAccountTradesStatisticsPerSymbol(req.params.accountName));
            }
            catch (_m) {
                res.status(500).send();
            }
        });
        this.getAccountStatisticsInTimeRange = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res
                    .status(200)
                    .send(yield Accounts_1.Accounts.getAccountTradesStatisticsInTimeRange(req.params.accountName, parseInt(req.params.startDate), parseInt(req.params.endDate)));
            }
            catch (_o) {
                res.status(500).send();
            }
        });
        this.getAccountsOrdersSymbols = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res.status(200).send(yield Accounts_1.Accounts.getAccountsOrdersSymbols());
            }
            catch (_p) {
                res.status(500).send();
            }
        });
        this.getAccountOrdersSymbols = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res
                    .status(200)
                    .send(yield Accounts_1.Accounts.getAccountOrdersSymbols(req.params.accountName));
            }
            catch (_q) {
                res.status(500).send();
            }
        });
        this.getAccountsNames = (req, res) => {
            try {
                res.status(200).send(Accounts_1.Accounts.getAccountsNames());
            }
            catch (_a) {
                res.status(500).send();
            }
        };
        this.getBarsWithOrdersAndStopLossesAndTakeProfits = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res
                    .status(200)
                    .send(yield Accounts_1.Accounts.getBarsWithOrdersAndStopLossesAndTakeProfits(req.params.accountName, req.params.symbol, parseInt(req.params.timeFrame), req.params.TimeFrameUnit));
            }
            catch (_r) {
                res.status(500).send();
            }
        });
        this.getBarsWithOrdersWithSmaAndStopLossesAndTakeProfits = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res
                    .status(200)
                    .send(yield Accounts_1.Accounts.getBarsWithOrdersWithSmaAndStopLossesAndTakeProfits(req.params.accountName, req.params.symbol, parseInt(req.params.timeFrame), req.params.TimeFrameUnit, parseInt(req.params.smaLength), parseFloat(req.params.startMilliseconds)));
            }
            catch (_s) {
                res.status(500).send();
            }
        });
        this.getBarsWithOrdersAndMinMaxPointsAndStopLossesAndTakeProfits = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res
                    .status(200)
                    .send(yield Accounts_1.Accounts.getBarsWithOrdersAndMinMaxPointsAndStopLossesAndTakeProfits(req.params.accountName, req.params.symbol, parseInt(req.params.timeFrame), req.params.TimeFrameUnit, parseInt(req.params.rollingWindow), parseFloat(req.params.startMilliseconds)));
            }
            catch (_t) {
                res.status(500).send();
            }
        });
        this.getAllOrders = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res.status(200).send(yield Accounts_1.Accounts.getAllOrders());
            }
            catch (_u) {
                res.status(500).send();
            }
        });
        this.getAccountAllOrders = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res
                    .status(200)
                    .send(yield Accounts_1.Accounts.getAccountAllOrders(req.params.accountName));
            }
            catch (_v) {
                res.status(500).send();
            }
        });
        this.getAccountAllOpenOrders = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res
                    .status(200)
                    .send(yield Accounts_1.Accounts.getAccountAllOpenOrders(req.params.accountName));
            }
            catch (_w) {
                res.status(500).send();
            }
        });
    }
}
exports.default = new AccountsController();
//# sourceMappingURL=accounts.contoller.js.map