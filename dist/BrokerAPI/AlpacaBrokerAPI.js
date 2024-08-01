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
const strategiesTypes_1 = require("../models/strategiesTypes");
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
    getMoneyAmount() {
        return __awaiter(this, void 0, void 0, function* () {
            return parseInt((yield this.alpaca.getAccount()).portfolio_value);
        });
    }
    getLastOrder(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            const twoMonthsInMilliseconds = 5259600000;
            return (yield this.alpaca.getOrders({
                status: "closed",
                limit: 5,
                after: new Date(new Date().getTime() - twoMonthsInMilliseconds).toISOString(),
                until: new Date(new Date().getTime()).toISOString(),
                direction: "desc",
                nested: "true",
                symbols: symbol !== undefined ? symbol : "",
            })).find((order) => order.status === "filled");
        });
    }
    fetchAllOrders(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            const thirtyDaysInMilliseconds = 2592000000;
            let allOrders = [];
            let orders = [];
            let index = 1;
            while (orders.length !== 0 || index == 1) {
                orders = yield this.alpaca.getOrders({
                    status: "all",
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
            return allOrders.reverse();
        });
    }
    getPositions() {
        return __awaiter(this, void 0, void 0, function* () {
            const positions = yield this.alpaca.getPositions();
            return positions.length !== 0
                ? positions
                    .map((position) => {
                    return this.convertAlpacaPositionToPosition(position);
                })
                    .sort((a, b) => b.pNl - a.pNl)
                : [];
        });
    }
    getFifteenMinTSLAFromGuetaStratgeyPositions(stopLossPercent) {
        return __awaiter(this, void 0, void 0, function* () {
            const positions = yield this.alpaca.getPositions();
            return positions.length !== 0
                ? (yield Promise.all(positions.map((position) => __awaiter(this, void 0, void 0, function* () {
                    return yield this.addDataToFifteenMinTSLAFromGuetaStratgeyPosition(this.convertAlpacaPositionToPosition(position), stopLossPercent);
                })))).sort((a, b) => b.pNl - a.pNl)
                : [];
        });
    }
    getPositionsForStrategy(account) {
        return __awaiter(this, void 0, void 0, function* () {
            if (account.strategy === strategiesTypes_1.StrategyType.SHEFA) {
                return yield Promise.all(yield (yield this.alpaca.getPositions()).map((position) => __awaiter(this, void 0, void 0, function* () {
                    return yield this.getShefaStratgeyPosition(position.symbol);
                })));
            }
            else if (account.strategy === strategiesTypes_1.StrategyType.FIFTEEN_MIN_TSLA_FROM_GUETA) {
                return yield this.getFifteenMinTSLAFromGuetaStratgeyPositions(account.defaultStopLossPercentInTrade);
            }
            else {
                return yield this.getPositions();
            }
        });
    }
    getPositionForStrategy(symbol, account) {
        return __awaiter(this, void 0, void 0, function* () {
            if (account.strategy === strategiesTypes_1.StrategyType.SHEFA) {
                return yield this.getShefaStratgeyPosition(symbol);
            }
            else if (account.strategy === strategiesTypes_1.StrategyType.FIFTEEN_MIN_TSLA_FROM_GUETA) {
                return yield this.getFifteenMinTSLAFromGuetaStratgeyPosition(symbol, account.defaultStopLossPercentInTrade);
            }
            else {
                return yield this.getPosition(symbol);
            }
        });
    }
    getPosition(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const position = yield this.alpaca.getPosition(symbol);
                return this.convertAlpacaPositionToPosition(position);
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
    getFifteenMinTSLAFromGuetaStratgeyPosition(symbol, stopLossPercent) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.addDataToFifteenMinTSLAFromGuetaStratgeyPosition(this.convertAlpacaPositionToPosition(yield this.alpaca.getPosition(symbol)), stopLossPercent);
            }
            catch (error) {
                return null;
            }
        });
    }
    getShefaStratgeyPosition(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const brokerPosition = yield this.alpaca.getPosition(symbol);
                const brokerClosedOrders = yield this.fetchAllClosedOrders(symbol);
                const lastTwoOrdersWithLegs = this.getTwoLastOrdersWithLegs(brokerClosedOrders);
                const tradeType = (0, TradeType_1.getTradeTypeFromString)(brokerPosition.side);
                const position = {
                    symbol: symbol,
                    type: tradeType,
                    qty: Math.abs(brokerPosition.qty),
                    entryPrice: parseFloat(brokerPosition.avg_entry_price),
                };
                position.wantedEntryPrice = parseFloat(lastTwoOrdersWithLegs[0].stop_price);
                position.pNl = parseFloat(brokerPosition.unrealized_pl);
                const takeProfit = this.getTakeProfitOrderForShefaStratgey(lastTwoOrdersWithLegs, tradeType);
                position.takeProfits = [takeProfit];
                position.isTakenBaseProfit = takeProfit.isTaken;
                const originalStopLoss = this.getOriginalStopLossForShefaStratgey(lastTwoOrdersWithLegs);
                position.stopLossesHistory = [originalStopLoss];
                const positionEntryTime = new Date(lastTwoOrdersWithLegs[lastTwoOrdersWithLegs.length - 1].filled_at);
                position.entryTime = positionEntryTime;
                position.entries = [
                    {
                        price: parseFloat(brokerPosition.avg_entry_price),
                        qty: originalStopLoss.qty,
                        date: positionEntryTime,
                    },
                ];
                position.stopLosses = yield this.getStopLossesForShefaStratgey(symbol, position.type);
                position.exits =
                    this.getPositionExitsForShefaStratgey(brokerClosedOrders);
                let exitsPnL = 0;
                position.exits.forEach((exit) => {
                    const pNlInExitPerStock = position.type === TradeType_1.TradeType.LONG
                        ? exit.price - position.entryPrice
                        : position.entryPrice - exit.price;
                    exitsPnL += pNlInExitPerStock * exit.qty;
                });
                const originalStopLossPerStock = position.type === TradeType_1.TradeType.LONG
                    ? position.entryPrice - originalStopLoss.price
                    : originalStopLoss.price - position.entryPrice;
                const firstStopLossAmount = Math.abs(originalStopLossPerStock) *
                    Math.abs(position.stopLossesHistory[0].qty);
                position.overAllPnL = exitsPnL + position.pNl;
                position.ratio = position.overAllPnL / firstStopLossAmount;
                return position;
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
    getTwoLastOrdersWithLegs(orders) {
        const ordersWithLegs = [];
        orders.reverse().forEach((order) => {
            if (ordersWithLegs.length < 2 && order.legs) {
                ordersWithLegs.push(order);
            }
        });
        return ordersWithLegs;
    }
    getTakeProfitOrderForShefaStratgey(lastTwoOrdersWithLegs, positionType) {
        let takeProfitPrice = 0;
        let takeProfitQty = 0;
        let isTakenBaseProfit = false;
        for (let order of lastTwoOrdersWithLegs) {
            order.legs.forEach((leg) => {
                if (leg.limit_price &&
                    (takeProfitPrice === 0 ||
                        (positionType === TradeType_1.TradeType.LONG
                            ? leg.limit_price < takeProfitPrice
                            : leg.limit_price > takeProfitPrice))) {
                    takeProfitPrice = parseFloat(leg.limit_price);
                    takeProfitQty = parseInt(leg.qty);
                    if (leg.filled_avg_price) {
                        isTakenBaseProfit = true;
                    }
                }
            });
        }
        return {
            price: takeProfitPrice,
            qty: takeProfitQty,
            isTaken: isTakenBaseProfit,
            date: lastTwoOrdersWithLegs[0].created_at,
        };
    }
    getOriginalStopLossForShefaStratgey(lastTwoOrdersWithLegs) {
        let stopLossPrice = 0;
        let stopLossQty = 0;
        let isTaken = false;
        for (let order of lastTwoOrdersWithLegs) {
            order.legs.forEach((leg) => {
                if (leg.stop_price) {
                    stopLossPrice = parseFloat(leg.stop_price);
                    stopLossQty += parseInt(leg.qty);
                    if (leg.filled_avg_price) {
                        isTaken = true;
                    }
                    else {
                        isTaken = false;
                    }
                }
            });
        }
        return {
            price: stopLossPrice,
            qty: stopLossQty,
            isTaken,
            date: lastTwoOrdersWithLegs[0].created_at,
        };
    }
    getStopLossesForShefaStratgey(symbol, tradeType) {
        return __awaiter(this, void 0, void 0, function* () {
            let orders = (yield this.fetchAllOrders(symbol)).filter((order) => order.status !== "canceled");
            orders = orders.slice(orders.length - 2, orders.length);
            let isOrdersOriginalStopLosses = false;
            orders.forEach((order) => {
                if (order.legs) {
                    isOrdersOriginalStopLosses = true;
                }
                else {
                    isOrdersOriginalStopLosses = false;
                }
            });
            if (isOrdersOriginalStopLosses) {
                let stopLossPrice = 0;
                let stopLossQty = 0;
                let isStopLossTaken = false;
                orders.forEach((order) => {
                    order.legs.forEach((leg) => {
                        if (leg.stop_price) {
                            stopLossPrice = parseFloat(leg.stop_price);
                            stopLossQty += parseInt(leg.qty);
                            if (leg.filled_avg_price) {
                                isStopLossTaken = true;
                            }
                            else {
                                isStopLossTaken = false;
                            }
                        }
                    });
                });
                return [
                    {
                        price: stopLossPrice,
                        qty: stopLossQty,
                        isTaken: isStopLossTaken,
                        date: orders[0].created_at,
                    },
                ];
            }
            else if (
            //is orders created at the same time. there might be a delay in the broker.
            Math.abs(new Date(orders[0].created_at).getTime() -
                new Date(orders[1].created_at).getTime()) < 30000) {
                //הפקודות בסדר הנכון
                const ordersInOriginalOrder = (orders[0].stop_price > orders[1].stop_price &&
                    tradeType === TradeType_1.TradeType.LONG) ||
                    (orders[0].stop_price < orders[1].stop_price &&
                        tradeType === TradeType_1.TradeType.SHORT)
                    ? [orders[0], orders[1]]
                    : [orders[1], orders[0]];
                return ordersInOriginalOrder.map((order) => {
                    let isTaken = false;
                    if (order.filled_avg_price) {
                        isTaken = true;
                    }
                    return {
                        price: parseFloat(order.stop_price),
                        qty: parseInt(order.qty),
                        isTaken: isTaken,
                        date: order.created_at,
                    };
                });
            }
            else {
                return [
                    {
                        price: parseFloat(orders[1].stop_price),
                        qty: parseInt(orders[1].qty),
                        isTaken: false,
                        date: orders[1].created_at,
                    },
                ];
            }
        });
    }
    getPositionExitsForShefaStratgey(orders) {
        const exits = [];
        const lastLegIndex = orders.findIndex((order) => order.legs);
        orders.slice(lastLegIndex, lastLegIndex + 2).forEach((order) => {
            if (order.legs) {
                order.legs.forEach((leg) => {
                    if (leg.filled_avg_price && leg.limit_price) {
                        exits.push({
                            price: parseFloat(leg.filled_avg_price),
                            qty: parseFloat(leg.qty),
                            isTaken: true,
                            date: new Date(leg.filled_at),
                        });
                    }
                });
            }
        });
        orders.slice(0, lastLegIndex).forEach((order) => {
            if (order.filled_avg_price) {
                exits.push({
                    price: parseFloat(order.filled_avg_price),
                    qty: parseFloat(order.qty),
                    isTaken: true,
                    date: new Date(order.filled_at),
                });
            }
        });
        return exits;
    }
    getPositionPnL(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return parseFloat((yield this.alpaca.getPosition(symbol)).unrealized_pl);
            }
            catch (error) {
                if (error === 404) {
                    // Position not found
                    return null;
                }
            }
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
    getClosedTrades(account) {
        return __awaiter(this, void 0, void 0, function* () {
            const orders = this.sortOrdersBySymbol(yield this.fetchAllClosedOrders());
            try {
                return this.createTradesFromOrders(orders, account).sort((a, b) => b.entryTime.getTime() - a.entryTime.getTime());
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    fetchAllClosedOrders(symbol, startDateInMilliseconds) {
        return __awaiter(this, void 0, void 0, function* () {
            const twoYearsInMilliseconds = 63113904000;
            startDateInMilliseconds = startDateInMilliseconds
                ? Math.max(startDateInMilliseconds, new Date(new Date().getTime() - twoYearsInMilliseconds).getTime())
                : null;
            const thirtyDaysInMilliseconds = 2592000000;
            let allOrders = [];
            let orders = [];
            let index = 1;
            let after = new Date(new Date().getTime() - thirtyDaysInMilliseconds * index);
            let until = new Date(new Date().getTime() - thirtyDaysInMilliseconds * (index - 1));
            while ((orders.length !== 0 || index == 1) &&
                (startDateInMilliseconds
                    ? until.getTime() >= startDateInMilliseconds
                    : true)) {
                orders = yield this.alpaca.getOrders({
                    status: "closed",
                    limit: 500,
                    after: after.toISOString(),
                    until: until.toISOString(),
                    direction: "desc",
                    nested: "true",
                    symbols: symbol !== undefined ? symbol : "",
                });
                allOrders = allOrders.concat(orders);
                index++;
                after = new Date(new Date().getTime() - thirtyDaysInMilliseconds * index);
                until = new Date(new Date().getTime() - thirtyDaysInMilliseconds * (index - 1));
            }
            return allOrders
                .filter((order) => parseInt(order.filled_qty) > 0 || order.status !== "canceled")
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
    createTradesFromOrders(orders, account) {
        let ordersWithLegsOut = [];
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
        ordersWithLegsOut = ordersWithLegsOut.sort((a, b) => new Date(a.filled_at).getTime() - new Date(b.filled_at).getTime());
        const closedTrades = [];
        let symbol = "";
        let entries = [];
        let exits = [];
        let entryQty = 0;
        let exitQty = 0;
        let tradeType = null;
        let originalStopLossPrice = null;
        ordersWithLegsOut.forEach((order) => {
            if (order.legs) {
                order.legs.forEach((leg) => {
                    if (leg.stop_price) {
                        originalStopLossPrice = parseFloat(leg.stop_price);
                    }
                });
            }
            const qty = parseInt(order.filled_qty);
            if (entryQty === 0 || symbol != order.symbol) {
                symbol = order.symbol;
                entries = [
                    {
                        price: parseFloat(order.filled_avg_price),
                        qty: qty,
                        date: order.filled_at,
                    },
                ];
                exits = [];
                entryQty = qty;
                exitQty = 0;
                tradeType = (0, TradeType_1.convertBuyOrSellStringToTradeType)(order.side);
                originalStopLossPrice = null;
            }
            else {
                if ((0, TradeType_1.convertBuyOrSellStringToTradeType)(order.side) === tradeType) {
                    entries.push({
                        price: parseFloat(order.filled_avg_price),
                        qty: qty,
                        date: order.filled_at,
                    });
                    entryQty += qty;
                }
                else {
                    exits.push({
                        price: parseFloat(order.filled_avg_price),
                        qty: qty,
                        date: order.filled_at,
                    });
                    exitQty += qty;
                    if (entryQty === exitQty) {
                        closedTrades.push((0, utils_1.createTradeFromOrdersData)(symbol, entries, exits, entryQty, tradeType, (account === null || account === void 0 ? void 0 : account.strategy) === strategiesTypes_1.StrategyType.FIFTEEN_MIN_TSLA_FROM_GUETA
                            ? entries[0].price -
                                (account.defaultStopLossPercentInTrade / 100) *
                                    entries[0].price
                            : originalStopLossPrice, account));
                        symbol = "";
                        entries = [];
                        exits = [];
                        entryQty = 0;
                        exitQty = 0;
                        tradeType = null;
                        originalStopLossPrice = null;
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
    getClosedOrdersBySymbol(symbol, startDateInMilliseconds) {
        return __awaiter(this, void 0, void 0, function* () {
            const orders = [];
            const brokerOrders = yield this.fetchAllClosedOrders(symbol, startDateInMilliseconds);
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
    getAllOrders(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            const brokerOrders = yield this.fetchAllOrders(symbol);
            const formattedOrders = [];
            brokerOrders.forEach((order) => {
                const formattedOrder = this.convertAlpacaOrderToOrder(order);
                if (order.legs) {
                    order.legs.forEach((leg) => {
                        const formattedLeg = this.convertAlpacaOrderToOrder(leg);
                        if (leg.stop_price) {
                            formattedOrder.stopLosses = [formattedLeg];
                        }
                        else if (leg.limit_price) {
                            formattedOrder.takeProfits = [formattedLeg];
                        }
                    });
                }
                formattedOrders.push(formattedOrder);
            });
            return formattedOrders;
        });
    }
    convertAlpacaOrderToOrder(alpacaOrder) {
        const formattedOrder = {
            price: parseFloat(alpacaOrder.stop_price) ||
                parseFloat(alpacaOrder.limit_price) ||
                parseFloat(alpacaOrder.filled_avg_price),
            qty: parseInt(alpacaOrder.qty),
            side: alpacaOrder.side,
            date: new Date(alpacaOrder.created_at),
            status: this.convertAlpacaOrderSideToSide(alpacaOrder.status),
        };
        if (alpacaOrder.filled_avg_price) {
            formattedOrder.filledPrice = parseFloat(alpacaOrder.filled_avg_price);
            formattedOrder.filledQty = parseInt(alpacaOrder.filled_qty);
            formattedOrder.filledDate = new Date(alpacaOrder.filled_at);
        }
        return formattedOrder;
    }
    convertAlpacaOrderSideToSide(alpacaOrderSide) {
        if (alpacaOrderSide === "new" || alpacaOrderSide === "accepted") {
            return "open";
        }
        else if (alpacaOrderSide === "filled" || alpacaOrderSide === "closed") {
            return "filled";
        }
        else if (alpacaOrderSide === "canceled") {
            return alpacaOrderSide;
        }
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
            let currDate = "";
            let currAlpacaOpen = "";
            let currAlpacaClose = "";
            const filteredBars = [];
            for (let bar of bars) {
                const barYear = bar.Timestamp.substring(6, 10);
                const barDay = bar.Timestamp.substring(0, 2);
                const barMonth = bar.Timestamp.substring(3, 5);
                const barDateInAlpacaFormat = `${barYear}-${barMonth}-${barDay}T00:00:00Z`;
                if (currDate !== barDateInAlpacaFormat) {
                    currDate = barDateInAlpacaFormat;
                    const alpacaCalender = yield this.alpaca.getCalendar({
                        start: currDate,
                        end: currDate,
                    });
                    if (alpacaCalender.length !== 0) {
                        currAlpacaOpen = alpacaCalender[0].open;
                        currAlpacaClose = alpacaCalender[0].close;
                    }
                    else {
                        currAlpacaOpen = null;
                        currAlpacaClose = null;
                    }
                }
                if (currAlpacaOpen !== null &&
                    currAlpacaClose !== null &&
                    this.isTimeBetween(+currAlpacaOpen.substring(0, 2), //startHour
                    +currAlpacaOpen.substring(3, 5), //startMin
                    +currAlpacaClose.substring(0, 2), //endHour
                    -timeframe + +currAlpacaClose.substring(3, 5), //endMin
                    +bar.Timestamp.substring(12).substring(0, 2), //barHour
                    +bar.Timestamp.substring(12).substring(3, 5) //barMin
                    )) {
                    filteredBars.push(bar);
                }
            }
            return filteredBars;
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
    convertAlpacaPositionToPosition(alpacaPosition) {
        const tradeType = (0, TradeType_1.getTradeTypeFromString)(alpacaPosition.side);
        return {
            id: undefined,
            symbol: alpacaPosition.symbol,
            type: tradeType,
            qty: parseInt(alpacaPosition.qty),
            entryPrice: parseFloat(alpacaPosition.avg_entry_price),
            entryTime: undefined,
            pNl: parseFloat(alpacaPosition.unrealized_pl),
            percentPnL: (0, utils_1.calclautePercentagePnL)(alpacaPosition.avg_entry_price, alpacaPosition.current_price, tradeType),
            dailyPnl: parseFloat(alpacaPosition.unrealized_intraday_pl),
            currentStockPrice: parseFloat(alpacaPosition.current_price),
            netLiquidation: Math.abs(alpacaPosition.current_price * alpacaPosition.qty),
            overAllPnL: parseFloat(alpacaPosition.unrealized_pl),
        };
    }
    addDataToFifteenMinTSLAFromGuetaStratgeyPosition(position, stopLossPercent) {
        return __awaiter(this, void 0, void 0, function* () {
            const stopLossPrice = position.entryPrice - (stopLossPercent / 100) * position.entryPrice;
            position.stopLosses = [
                {
                    price: stopLossPrice,
                    qty: position.qty,
                },
            ];
            position.stopLossesHistory = [...position.stopLosses];
            position.ratio =
                position.pNl / ((position.entryPrice - stopLossPrice) * position.qty);
            position.entryTime = new Date((yield this.getLastOrder(position.symbol)).filled_at);
            return position;
        });
    }
}
AlpacaBrokerAPI.baseUrl = "https://paper-api.alpaca.markets"; // Use the paper trading base URL for testing
exports.default = AlpacaBrokerAPI;
//# sourceMappingURL=AlpacaBrokerAPI.js.map