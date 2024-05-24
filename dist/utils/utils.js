"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTradeFromOrdersData = exports.calclautePercentagePnL = void 0;
const TradeType_1 = require("../models/TradeType");
const calclautePercentagePnL = (entryPrice, closePrice, tradeType) => {
    return ((tradeType === TradeType_1.TradeType.LONG
        ? (closePrice - entryPrice) / entryPrice
        : (entryPrice - closePrice) / closePrice) * 100);
};
exports.calclautePercentagePnL = calclautePercentagePnL;
const calclautePnL = (entryPrice, closePrice, tradeType, qty) => {
    return ((tradeType === TradeType_1.TradeType.LONG
        ? closePrice - entryPrice
        : entryPrice - closePrice) * qty);
};
const calculateAvgPrice = (priceAndQty) => {
    let totalCost = 0;
    let totalQty = 0;
    for (const item of priceAndQty) {
        totalCost += item.price * item.qty;
        totalQty += item.qty;
    }
    return totalQty === 0 ? 0 : totalCost / totalQty;
};
const createTradeFromOrdersData = (symbol, entries, exits, qty, tradeType) => {
    const entryPrice = calculateAvgPrice(entries);
    const closePrice = calculateAvgPrice(exits);
    return {
        symbol: symbol,
        type: tradeType,
        qty: qty,
        entryPrice: entryPrice,
        entryTime: new Date(entries[0].date),
        pNl: calclautePnL(entryPrice, closePrice, tradeType, qty),
        percentPnL: (0, exports.calclautePercentagePnL)(entryPrice, closePrice, tradeType),
        closePrice: closePrice,
        closeTime: new Date(exits[exits.length - 1].date),
        entries: entries,
        exits: exits,
    };
};
exports.createTradeFromOrdersData = createTradeFromOrdersData;
//# sourceMappingURL=utils.js.map