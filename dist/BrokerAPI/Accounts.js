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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Accounts = void 0;
const AlpacaBrokerAPI_1 = __importDefault(require("./AlpacaBrokerAPI"));
const env_1 = require("../env");
const TradeType_1 = require("../models/TradeType");
class Accounts {
    static getAccounts() {
        return this.accounts;
    }
    static intalizeAccounts() {
        return env_1.accountsInfo.map((accountInfo) => {
            return {
                iBrokerAPI: new AlpacaBrokerAPI_1.default(accountInfo.API_KEY, accountInfo.API_SECRET),
                name: accountInfo.NAME,
            };
        });
    }
    static getAccountsPositions() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Promise.all(this.accounts.map((account) => __awaiter(this, void 0, void 0, function* () {
                return {
                    accountName: account.name,
                    positions: yield account.iBrokerAPI.getPositions(),
                };
            })));
        });
    }
    static getAccountValuesHistory() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Promise.all(this.accounts.map((account) => __awaiter(this, void 0, void 0, function* () {
                return {
                    accountName: account.name,
                    accountValuesHistory: yield account.iBrokerAPI.getAccountValuesHistory(),
                };
            })));
        });
    }
    static getClosedTrades() {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.all(this.accounts.map((account) => __awaiter(this, void 0, void 0, function* () {
                return {
                    accountName: account.name,
                    trades: yield account.iBrokerAPI.getClosedTrades(),
                };
            })));
        });
    }
    static getStartMoneyAmount(accountName) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.accounts
                .find((account) => account.name === accountName)
                .iBrokerAPI.getAccountValuesHistory())[0].value;
        });
    }
    static getMoneyAmount(accountName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.accounts
                .find((account) => account.name === accountName)
                .iBrokerAPI.getMoneyAmount();
        });
    }
    static getAccountTradesStatistics(accountName) {
        return __awaiter(this, void 0, void 0, function* () {
            const trades = yield this.accounts
                .find((account) => account.name === accountName)
                .iBrokerAPI.getClosedTrades();
            const startMoneyAmount = yield this.getStartMoneyAmount(accountName);
            const moneyAmount = yield this.getMoneyAmount(accountName);
            const pNl = moneyAmount - startMoneyAmount;
            const winningTrades = trades.filter((trade) => trade.pNl > 0);
            const avgWinningTrade = this.getAvgWinningTrade(winningTrades);
            const avgLosingTrade = this.getAvgLosingTrade(trades);
            const longTradesPrecentage = (trades.filter((trade) => trade.type === TradeType_1.TradeType.LONG).length /
                trades.length) *
                100;
            return {
                startMoneyAmount: startMoneyAmount,
                moneyAmount: moneyAmount,
                pNl: pNl,
                percentPNl: (pNl / startMoneyAmount) * 100,
                winningTradesCount: winningTrades.length,
                losingTradesCount: trades.length - winningTrades.length,
                successRate: (winningTrades.length / trades.length) * 100,
                avgWinningTrade: avgWinningTrade,
                avgLosingTrade: avgLosingTrade,
                ratio: avgWinningTrade / avgLosingTrade,
                largestWinningTrade: Math.max(...trades.map((trade) => trade.pNl)),
                largestLosingTrade: Math.min(...trades.map((trade) => trade.pNl)),
                longPrecentage: longTradesPrecentage,
                shortPrecentage: 100 - longTradesPrecentage,
            };
        });
    }
    static getAvgWinningTrade(winningTrades) {
        let sum = 0;
        winningTrades.forEach((trade) => {
            sum += trade.pNl;
        });
        return sum / winningTrades.length;
    }
    static getAvgLosingTrade(trades) {
        const losingTrades = trades.filter((trade) => trade.pNl < 0);
        let sum = 0;
        losingTrades.forEach((trade) => (sum += trade.pNl));
        return Math.abs(sum) / losingTrades.length;
    }
    static getAccountsOrdersSymbols() {
        return Promise.all(this.accounts.map((account) => __awaiter(this, void 0, void 0, function* () {
            return {
                accountName: account.name,
                symbols: yield account.iBrokerAPI.getAllOrdersSymbols(),
            };
        })));
    }
    static getAccountsNames() {
        return this.accounts.map(account => account.name);
    }
    static getBarsWithOrders(accountName, symbol, timeFrame, timeFrameUnit) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const account = this.accounts.find(account => account.name === accountName);
                const orders = yield account.iBrokerAPI.getOrdersBySymbol(symbol);
                const fiveDaysInMilliseconds = 432000000;
                const startDate = new Date(orders[0].date.getTime() - fiveDaysInMilliseconds).toISOString();
                const bars = yield account.iBrokerAPI.getBars(symbol, timeFrame, timeFrameUnit, true, startDate);
                return {
                    orders: orders,
                    bars: bars
                };
            }
            catch (error) {
                console.log(error);
            }
        });
    }
}
exports.Accounts = Accounts;
_a = Accounts;
Accounts.accounts = _a.intalizeAccounts();
//# sourceMappingURL=Accounts.js.map