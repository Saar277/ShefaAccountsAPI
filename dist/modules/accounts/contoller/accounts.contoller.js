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
        this.getAccountsValuesHistory = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res.status(200).send(yield Accounts_1.Accounts.getAccountValuesHistory());
            }
            catch (_b) {
                res.status(500).send();
            }
        });
        this.getAccountsTrades = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res.status(200).send(yield Accounts_1.Accounts.getClosedTrades());
            }
            catch (_c) {
                res.status(500).send();
            }
        });
        this.getAccountStatistics = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res
                    .status(200)
                    .send(yield Accounts_1.Accounts.getAccountTradesStatistics(req.params.accountName));
            }
            catch (_d) {
                res.status(500).send();
            }
        });
        this.getAccountsOrdersSymbols = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res.status(200).send(yield Accounts_1.Accounts.getAccountsOrdersSymbols());
            }
            catch (_e) {
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
        this.getBarsWithOrders = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                res
                    .status(200)
                    .send(yield Accounts_1.Accounts.getBarsWithOrders(req.params.accountName, req.params.symbol, parseInt(req.params.timeFrame), req.params.TimeFrameUnit));
            }
            catch (_f) {
                res.status(500).send();
            }
        });
    }
}
exports.default = new AccountsController();
//# sourceMappingURL=accounts.contoller.js.map