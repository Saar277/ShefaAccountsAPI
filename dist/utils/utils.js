"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSmaValuesFromBars = exports.filterTradesByTimeRange = exports.mapAccountValueInDateToPnlInEveryYear = exports.mapAccountValueInDateToPnlInEveryMonth = exports.createTradeFromOrdersData = exports.calclautePercentagePnL = void 0;
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
const mapAccountValueInDateToPnlInEveryMonth = (accountValuesInDates) => {
    return Object.values(accountValuesInDates.reduce((acc, obj) => {
        // Extract the month and year from the date
        const date = new Date(obj.date);
        const month = date.getMonth(); // Months are 0-indexed
        const year = date.getFullYear();
        const monthYear = `${year}-${month + 1}`; // Create a string to represent the month and year
        // If the monthYear key doesn't exist, create an array for it
        if (!acc[monthYear]) {
            acc[monthYear] = [];
        }
        // Add the object to the respective monthYear array
        acc[monthYear].push(obj);
        return acc;
    }, {})).map((array) => {
        const firstValueInMonth = array[0].value;
        const lastValueInMonth = array[array.length - 1].value;
        return {
            date: array[0].date,
            pNl: lastValueInMonth - firstValueInMonth,
        };
    });
};
exports.mapAccountValueInDateToPnlInEveryMonth = mapAccountValueInDateToPnlInEveryMonth;
const mapAccountValueInDateToPnlInEveryYear = (accountValuesInDates) => {
    return Object.values(accountValuesInDates.reduce((acc, obj) => {
        // Extract the year from the date
        const date = new Date(obj.date);
        const year = date.getFullYear();
        // If the year key doesn't exist, create an array for it
        if (!acc[year]) {
            acc[year] = [];
        }
        // Add the object to the respective year array
        acc[year].push(obj);
        return acc;
    }, {})).map((array) => {
        const firstValueInYear = array[0].value;
        const lastValueInYear = array[array.length - 1].value;
        return {
            date: array[0].date,
            pNl: lastValueInYear - firstValueInYear,
        };
    });
};
exports.mapAccountValueInDateToPnlInEveryYear = mapAccountValueInDateToPnlInEveryYear;
const filterTradesByTimeRange = (trades, startDateInMilliseconds, endDateInMilliseconds) => {
    return trades.filter((trade) => trade.closeTime.getTime() >= startDateInMilliseconds &&
        trade.closeTime.getTime() <= endDateInMilliseconds);
};
exports.filterTradesByTimeRange = filterTradesByTimeRange;
const calculateSmaByBars = (bars, smaLength) => {
    let sum = 0;
    let index = 1;
    let currBar = bars[bars.length - index];
    while (index <= smaLength && currBar) {
        sum += currBar.closePrice;
        index++;
        currBar = bars[bars.length - index];
    }
    return sum / (index - 1);
};
const getSmaValuesFromBars = (bars, smaLength) => {
    const passedBars = [];
    const smaValues = [];
    for (let bar of bars) {
        passedBars.push(bar);
        smaValues.push({
            date: bar.time,
            value: calculateSmaByBars(passedBars, smaLength)
        });
    }
    return smaValues;
};
exports.getSmaValuesFromBars = getSmaValuesFromBars;
//# sourceMappingURL=utils.js.map