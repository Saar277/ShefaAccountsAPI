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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const alpaca_trade_api_1 = __importDefault(require("@alpacahq/alpaca-trade-api"));
const entityv2_1 = require("@alpacahq/alpaca-trade-api/dist/resources/datav2/entityv2");
const utils_1 = require("../utils/utils");
const TradeType_1 = require("../models/TradeType");
const lodash_1 = require("lodash");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
class AlpacaBrokerAPI {
    constructor(apiKey, apiSecret) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.connect();
    }
    connect() {
        this.alpaca = new alpaca_trade_api_1.default({
            keyId: this.apiKey,
            secretKey: this.apiSecret,
            baseUrl: AlpacaBrokerAPI.baseUrl,
            paper: true, // Set to true for paper trading
        });
    }
    disconnect() {
        return new Promise((resolve) => resolve(true));
        // Implement disconnection logic for Alpaca
        // For example: this.alpaca.close();
    }
    getAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.alpaca.getAccount();
        });
    }
    getClock() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.alpaca.getClock();
        });
    }
    getBars(symbol, timeFrame, timeFrameUnit, onlyMarketHours, startDate, endDate) {
        var _a, e_1, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const bars = yield this.alpaca.getBarsV2(symbol, {
                start: startDate,
                end: endDate,
                timeframe: this.alpaca.newTimeframe(timeFrame, timeFrameUnit),
            });
            let historicalData = [];
            try {
                for (var _d = true, bars_1 = __asyncValues(bars), bars_1_1; bars_1_1 = yield bars_1.next(), _a = bars_1_1.done, !_a;) {
                    _c = bars_1_1.value;
                    _d = false;
                    try {
                        let bar = _c;
                        bar.Timestamp = new Date(bar.Timestamp).toLocaleString("en-GB", {
                            timeZone: "America/New_York",
                        });
                        historicalData.push(bar);
                    }
                    finally {
                        _d = true;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = bars_1.return)) yield _b.call(bars_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            historicalData =
                onlyMarketHours &&
                    timeFrameUnit !== entityv2_1.TimeFrameUnit.DAY &&
                    timeFrameUnit !== entityv2_1.TimeFrameUnit.MONTH &&
                    timeFrameUnit !== entityv2_1.TimeFrameUnit.WEEK
                    ? yield this.filterBarsOnlyMarketHours(historicalData, timeFrame)
                    : historicalData;
            return yield this.convertAlpacaBarsToBars(historicalData);
        });
    }
    createMarketOrder(symbol, qty, side) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.alpaca.createOrder({
                symbol,
                qty,
                side,
                type: "market",
                time_in_force: "gtc",
            });
        });
    }
    createLimitOrder(symbol, qty, side, limitPrice) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.alpaca.createOrder({
                symbol,
                qty,
                side,
                type: "limit",
                time_in_force: "gtc",
                limit_price: limitPrice,
            });
        });
    }
    createStopOrder(symbol, qty, side, stopPrice) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.alpaca.createOrder({
                symbol,
                qty,
                side,
                type: "stop",
                time_in_force: "gtc",
                stop_price: stopPrice,
            });
        });
    }
    createStopLimitOrder(symbol, qty, side, limitPrice, stopPrice) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.alpaca.createOrder({
                symbol,
                qty,
                side,
                type: "stop_limit",
                time_in_force: "gtc",
                limit_price: limitPrice,
                stop_price: stopPrice,
            });
        });
    }
    createTrailingStopOrder(symbol, qty, side, trailPrice, trailPercent) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.alpaca.createOrder({
                symbol,
                qty,
                side,
                type: "trailing_stop",
                time_in_force: "gtc",
                trail_price: trailPrice,
                trail_percent: trailPercent,
            });
        });
    }
    createTakeProfitOrder(symbol, qty, side, limitPrice) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.alpaca.createOrder({
                symbol,
                qty,
                side,
                type: "take_profit",
                time_in_force: "gtc",
                limit_price: limitPrice,
            });
        });
    }
    createEntryPriceWithStopLossAndTargetOrder(symbol, qty, side, entryPrice, stopLossPrice, stopLossQty, takeProfitPrice, takeProfitQty) {
        return __awaiter(this, void 0, void 0, function* () {
            //A workaround is to submit several braket orders. As an example, if one wanted to buy 10 shares, but new ahead of time one wanted to first sell 50 shares, then 25, then 25 more, simply submit 3 bracket orders for 50, 25, and 25 shares respectively. Each can have different stop loss and limit prices.
            //MAIN ORDER
            yield this.alpaca.createOrder({
                symbol: symbol,
                qty: qty * 0.5,
                side: side,
                type: "stop",
                stop_price: 172,
                time_in_force: "gtc",
                order_class: "bracket",
                stop_loss: {
                    stop_price: 100,
                    time_in_force: "gtc",
                },
                take_profit: {
                    limit_price: 200,
                    time_in_force: "gtc",
                },
            });
            yield this.alpaca.createOrder({
                symbol: symbol,
                qty: qty * 0.5,
                side: side,
                type: "stop",
                stop_price: 172,
                time_in_force: "gtc",
                order_class: "bracket",
                stop_loss: {
                    stop_price: 100,
                    time_in_force: "gtc",
                },
                take_profit: {
                    limit_price: 100000000,
                    time_in_force: "gtc",
                },
            });
            // // Take Profit Order
            // await this.alpaca.createOrder({
            //   symbol: symbol,
            //   qty: takeProfitPrice,
            //   side: (side == "buy") ? "sell" : "buy",
            //   type: "limit",
            //   limit_price: 180,
            //   time_in_force: "gtc"
            // })
            // // Stop Loss Order
            // await this.alpaca.createOrder({
            //   symbol: symbol,
            //   qty: stopLossQty,
            //   side: (side === "buy") ? "sell" : "buy",
            //   type: "stop",
            //   stop_price: stopLossPrice,
            //   time_in_force: "gtc"
            // });
        });
    }
    getOpenOrders(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            const filter = { status: "open", symbol };
            return this.alpaca.getOrders(filter);
        });
    }
    getCash() {
        return __awaiter(this, void 0, void 0, function* () {
            const account = yield this.alpaca.getAccount();
            return account.cash;
        });
    }
    getMoneyAmount() {
        return __awaiter(this, void 0, void 0, function* () {
            return parseInt((yield this.alpaca.getAccount()).portfolio_value);
        });
    }
    getPositions() {
        return __awaiter(this, void 0, void 0, function* () {
            const positions = yield this.alpaca.getPositions();
            return positions.length !== 0
                ? positions
                    .map((position) => {
                    const tradeType = (0, TradeType_1.getTradeTypeFromString)(position.side);
                    return {
                        symbol: position.symbol,
                        type: tradeType,
                        qty: position.qty,
                        entryPrice: position.avg_entry_price,
                        pNl: position.unrealized_pl,
                        percentPnL: (0, utils_1.calclautePercentagePnL)(position.avg_entry_price, position.current_price, tradeType),
                        dailyPnl: position.unrealized_intraday_pl,
                        currentStockPrice: position.current_price,
                        netLiquidation: Math.abs(position.current_price * position.qty),
                    };
                })
                    .sort((a, b) => b.pNl - a.pNl)
                : [];
        });
    }
    getPosition(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.alpaca.getPosition(symbol);
            }
            catch (error) {
                if (error === 404) {
                    // Position not found
                    return null;
                }
                // throw error;
            }
        });
    }
    isInPosition(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            const positions = yield this.alpaca.getPositions();
            return positions.some((position) => position.symbol === symbol);
        });
    }
    getAccountValuesHistory() {
        return __awaiter(this, void 0, void 0, function* () {
            const accountValuesHistory = [];
            const portfolioHistory = yield this.alpaca.getPortfolioHistory({
                period: "5A",
                timeframe: "1D",
                date_start: "",
                date_end: "",
                extended_hours: "",
            });
            portfolioHistory.equity.forEach((value, index) => {
                if (value !== 0) {
                    accountValuesHistory.push({
                        value: value,
                        date: new Date(portfolioHistory.timestamp[index] * 1000),
                    });
                }
            });
            return accountValuesHistory;
        });
    }
    getClosedTrades() {
        return __awaiter(this, void 0, void 0, function* () {
            const orders = this.sortOrdersBySymbol(yield this.fetchAllClosedOrders());
            return this.createTradesFromOrders(orders).sort((a, b) => b.entryTime.getTime() - a.entryTime.getTime());
        });
    }
    fetchAllClosedOrders(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            const thirtyDaysInMilliseconds = 2592000000;
            let allOrders = [];
            let orders = [];
            let index = 1;
            while (orders.length !== 0 || index == 1) {
                orders = yield this.alpaca.getOrders({
                    status: "closed",
                    limit: 500,
                    after: new Date(new Date().getTime() - thirtyDaysInMilliseconds * index).toISOString(),
                    until: new Date(new Date().getTime() - thirtyDaysInMilliseconds * (index - 1)).toISOString(),
                    direction: "desc",
                    nested: "true",
                    symbols: symbol !== undefined ? symbol : "",
                });
                allOrders = allOrders.concat(orders);
                index++;
            }
            return allOrders
                .filter((order) => parseInt(order.filled_qty) > 0)
                .reverse();
        });
    }
    sortOrdersBySymbol(orders) {
        return orders.sort((a, b) => {
            const nameA = a.symbol.toUpperCase(); // ignore upper and lowercase
            const nameB = b.symbol.toUpperCase(); // ignore upper and lowercase
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }
            // names must be equal
            return 0;
        });
    }
    createTradesFromOrders(orders) {
        const ordersWithLegsOut = [];
        orders.forEach((order) => {
            ordersWithLegsOut.push(order);
            if (order.legs) {
                order.legs.forEach((leg) => {
                    if (leg.filled_avg_price) {
                        ordersWithLegsOut.push(leg);
                    }
                });
            }
        });
        const closedTrades = [];
        let symbol = "";
        let entries = [];
        let exits = [];
        let entryQty = 0;
        let exitQty = 0;
        let tradeType = null;
        ordersWithLegsOut.forEach((order) => {
            const qty = parseInt(order.filled_qty);
            if (entryQty === 0 || symbol != order.symbol) {
                symbol = order.symbol;
                entries = [
                    {
                        price: order.filled_avg_price,
                        qty: qty,
                        date: order.filled_at,
                    },
                ];
                exits = [];
                entryQty = qty;
                exitQty = 0;
                tradeType = (0, TradeType_1.convertBuyOrSellStringToTradeType)(order.side);
            }
            else {
                if ((0, TradeType_1.convertBuyOrSellStringToTradeType)(order.side) === tradeType) {
                    entries.push({
                        price: order.filled_avg_price,
                        qty: qty,
                        date: order.filled_at,
                    });
                    entryQty += qty;
                }
                else {
                    exits.push({
                        price: order.filled_avg_price,
                        qty: qty,
                        date: order.filled_at,
                    });
                    exitQty += qty;
                    if (entryQty === exitQty) {
                        closedTrades.push((0, utils_1.createTradeFromOrdersData)(symbol, entries, exits, entryQty, tradeType));
                        symbol = "";
                        entries = [];
                        exits = [];
                        entryQty = 0;
                        exitQty = 0;
                        tradeType = null;
                    }
                }
            }
        });
        return closedTrades;
    }
    getAllOrdersSymbols() {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, lodash_1.uniq)((yield this.fetchAllClosedOrders()).map((order) => order.symbol));
        });
    }
    getOrdersBySymbol(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            const orders = [];
            const brokerOrders = yield this.fetchAllClosedOrders(symbol);
            brokerOrders.forEach((order) => {
                orders.push({
                    price: parseFloat(order.filled_avg_price),
                    qty: parseFloat(order.qty),
                    date: new Date(order.filled_at),
                    type: order.side,
                });
                if (order.legs) {
                    order.legs.forEach((leg) => {
                        if (leg.filled_avg_price) {
                            orders.push({
                                price: parseFloat(leg.filled_avg_price),
                                qty: parseFloat(leg.qty),
                                date: new Date(leg.filled_at),
                                type: leg.side,
                            });
                        }
                    });
                }
            });
            return orders;
        });
    }
    convertAlpacaBarsToBars(bars) {
        return __awaiter(this, void 0, void 0, function* () {
            return bars.map((bar) => ({
                openPrice: bar.OpenPrice,
                closePrice: bar.ClosePrice,
                highPrice: bar.HighPrice,
                lowPrice: bar.LowPrice,
                time: this.convertApiDateFormatToJSDate(bar.Timestamp),
            }));
        });
    }
    filterBarsOnlyMarketHours(bars, timeframe) {
        return __awaiter(this, void 0, void 0, function* () {
            return bars.filter((bar) => {
                const time = bar.Timestamp.substring(12);
                const hour = +time.substring(0, 2);
                const minute = +time.substring(3, 5);
                return this.isTimeBetween(9, 30, 15, 60 - timeframe, hour, minute);
            });
        });
    }
    getDateInApiFormat(date) {
        const year = date.getFullYear().toString();
        let month = (date.getMonth() + 1).toString();
        month = month.length == 1 ? `0${month}` : month;
        let day = date.getDate().toString();
        day = day.length == 1 ? `0${day}` : day;
        return [year, month, day].join("-");
    }
    convertApiDateFormatToJSDate(dateString) {
        const dateInNewYork = moment_timezone_1.default.tz(dateString, "DD/MM/YYYY, HH:mm:ss", "America/New_York");
        const utcString = dateInNewYork.utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";
        return new Date(utcString);
    }
    isClockOpen() {
        return __awaiter(this, void 0, void 0, function* () {
            const clock = yield this.getClock();
            return clock.is_open;
        });
    }
    closePosition(symbol) {
        this.alpaca.closePosition(symbol);
    }
    isTimeBetween(startHour, startMinute, endHour, endMinute, targetHour, targetMinute) {
        // Convert all times to minutes for easier comparison
        const startTimeInMinutes = startHour * 60 + startMinute;
        const endTimeInMinutes = endHour * 60 + endMinute;
        const targetTimeInMinutes = targetHour * 60 + targetMinute;
        return (targetTimeInMinutes >= startTimeInMinutes &&
            targetTimeInMinutes <= endTimeInMinutes);
    }
    getTimeFrameFromString(str) {
        if (str === "Day") {
            return entityv2_1.TimeFrameUnit.DAY;
        }
        else if (str === "Hour") {
            return entityv2_1.TimeFrameUnit.HOUR;
        }
        else if (str === "Min") {
            return entityv2_1.TimeFrameUnit.MIN;
        }
        else if (str === "Month") {
            return entityv2_1.TimeFrameUnit.MONTH;
        }
        else if (str === "Week") {
            return entityv2_1.TimeFrameUnit.WEEK;
        }
    }
}
AlpacaBrokerAPI.baseUrl = "https://paper-api.alpaca.markets"; // Use the paper trading base URL for testing
exports.default = AlpacaBrokerAPI;
//# sourceMappingURL=AlpacaBrokerAPI.js.map