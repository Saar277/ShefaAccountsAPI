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
const utils_1 = require("../utils/utils");
class Accounts {
    static getAccounts() {
        return this.accounts;
    }
    static intalizeAccounts() {
        return env_1.accountsInfo.map((accountInfo) => {
            return {
                iBrokerAPI: new AlpacaBrokerAPI_1.default(accountInfo.API_KEY, accountInfo.API_SECRET),
                name: accountInfo.NAME,
                strategy: accountInfo.STRATEGY,
                defaultStopLossPercentInTrade: accountInfo.DEFAULT_STOP_LOSS_PERCENT_IN_TRADE,
            };
        });
    }
    static getAccountsPositions() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Promise.all(this.accounts.map((account) => __awaiter(this, void 0, void 0, function* () {
                return {
                    accountName: account.name,
                    positions: yield account.iBrokerAPI.getPositionsForStrategy(account),
                };
            })));
        });
    }
    static getAccountPositions(accountName) {
        return __awaiter(this, void 0, void 0, function* () {
            const account = this.accounts.find((account) => account.name === accountName);
            return yield account.iBrokerAPI.getPositionsForStrategy(account);
        });
    }
    static getAccountsValuesHistory() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Promise.all(this.accounts.map((account) => __awaiter(this, void 0, void 0, function* () {
                return {
                    accountName: account.name,
                    accountValuesHistory: yield account.iBrokerAPI.getAccountValuesHistory(),
                };
            })));
        });
    }
    static getAccountValuesHistory(accountName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.accounts
                .find((account) => account.name === accountName)
                .iBrokerAPI.getAccountValuesHistory();
        });
    }
    static getAccountValuesHistoryInDatesRange(accountName, startDateInMilliseconds, endDateInMilliseconds) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.accounts
                .find((account) => account.name === accountName)
                .iBrokerAPI.getAccountValuesHistory()).filter((valueInDate) => {
                const valueInDateMilliseconds = valueInDate.date.getTime();
                return (valueInDateMilliseconds >= startDateInMilliseconds &&
                    valueInDateMilliseconds <= endDateInMilliseconds);
            });
        });
    }
    static getAccountPnlInEveryMonthOrYear(accountName, monthOrYear) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountValuesInDates = yield this.accounts
                .find((account) => account.name === accountName)
                .iBrokerAPI.getAccountValuesHistory();
            return monthOrYear === "month"
                ? (0, utils_1.mapAccountValueInDateToPnlInEveryMonth)(accountValuesInDates)
                : (0, utils_1.mapAccountValueInDateToPnlInEveryYear)(accountValuesInDates);
        });
    }
    static getClosedTrades() {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.all(this.accounts.map((account) => __awaiter(this, void 0, void 0, function* () {
                return {
                    accountName: account.name,
                    trades: yield account.iBrokerAPI.getClosedTrades(account),
                };
            })));
        });
    }
    static getClosedTradesForAccount(accountName) {
        return __awaiter(this, void 0, void 0, function* () {
            const account = this.accounts.find((account) => account.name === accountName);
            return yield account.iBrokerAPI.getClosedTrades(account);
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
        var _b;
        return __awaiter(this, void 0, void 0, function* () {
            const trades = yield this.getClosedTradesForAccount(accountName);
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
                startDate: (_b = trades[trades.length - 1]) === null || _b === void 0 ? void 0 : _b.entryTime,
            };
        });
    }
    static getAccountTradesStatisticsInTimeRange(accountName, startDateInMilliseconds, endDateInMilliseconds) {
        var _b;
        return __awaiter(this, void 0, void 0, function* () {
            const trades = (0, utils_1.filterTradesByTimeRange)(yield this.getClosedTradesForAccount(accountName), startDateInMilliseconds, endDateInMilliseconds);
            const valuesHistory = yield this.getAccountValuesHistoryInDatesRange(accountName, startDateInMilliseconds, endDateInMilliseconds);
            const startMoneyAmount = valuesHistory[0].value;
            const moneyAmount = valuesHistory[valuesHistory.length - 1].value;
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
                startDate: (_b = trades[trades.length - 1]) === null || _b === void 0 ? void 0 : _b.entryTime,
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
    static getAccountOrdersSymbols(accountName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.accounts
                .find((account) => account.name === accountName)
                .iBrokerAPI.getAllOrdersSymbols();
        });
    }
    static getAccountsNames() {
        return this.accounts.map((account) => account.name);
    }
    static getBarsWithOrdersAndStopLossesAndTakeProfits(accountName, symbol, timeFrame, timeFrameUnit) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const account = this.accounts.find((account) => account.name === accountName);
                const orders = yield account.iBrokerAPI.getOrdersBySymbol(symbol);
                const fiveDaysInMilliseconds = 432000000;
                const startDate = new Date(orders[0].date.getTime() - fiveDaysInMilliseconds).toISOString();
                const bars = yield account.iBrokerAPI.getBars(symbol, timeFrame, timeFrameUnit, true, startDate);
                const position = yield account.iBrokerAPI.getPositionForStrategy(symbol, account);
                return {
                    orders: orders,
                    bars: bars,
                    stopLosses: (position === null || position === void 0 ? void 0 : position.stopLosses) || [],
                    takeProfits: (position === null || position === void 0 ? void 0 : position.takeProfits) || [],
                };
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    static getBarsWithOrdersWithSmaAndStopLossesAndTakeProfits(accountName, symbol, timeFrame, timeFrameUnit, smaLength) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { orders, bars, stopLosses, takeProfits } = yield this.getBarsWithOrdersAndStopLossesAndTakeProfits(accountName, symbol, timeFrame, timeFrameUnit);
                return {
                    orders: orders,
                    bars: bars,
                    smaValues: (0, utils_1.getSmaValuesFromBars)(bars, smaLength),
                    stopLosses: stopLosses,
                    takeProfits: takeProfits,
                };
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    static getBarsWithOrdersAndMinMaxPointsAndStopLossesAndTakeProfits(accountName, symbol, timeFrame, timeFrameUnit, rollingWindow) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { orders, bars, stopLosses, takeProfits } = yield this.getBarsWithOrdersAndStopLossesAndTakeProfits(accountName, symbol, timeFrame, timeFrameUnit);
                const { minima, maxima } = (0, utils_1.findLocalMinimaMaximaIndices)(bars, rollingWindow);
                return {
                    orders: orders,
                    bars: bars,
                    minPoints: minima.map((bar) => {
                        return {
                            pricePoint: bar.pricePoint,
                            time: bar.time,
                        };
                    }),
                    maxPoints: maxima.map((bar) => {
                        return {
                            pricePoint: bar.pricePoint,
                            time: bar.time,
                        };
                    }),
                    stopLosses: stopLosses,
                    takeProfits: takeProfits,
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