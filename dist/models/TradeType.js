"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertBuyOrSellStringToTradeType = exports.getTradeTypeFromString = exports.TradeType = void 0;
var TradeType;
(function (TradeType) {
    TradeType["LONG"] = "LONG";
    TradeType["SHORT"] = "SHORT";
})(TradeType = exports.TradeType || (exports.TradeType = {}));
const getTradeTypeFromString = (str) => {
    str = str.toLowerCase();
    if (str === TradeType.LONG.toLowerCase()) {
        return TradeType.LONG;
    }
    else if (str === TradeType.SHORT.toLowerCase()) {
        return TradeType.SHORT;
    }
    else {
        return null;
    }
};
exports.getTradeTypeFromString = getTradeTypeFromString;
const convertBuyOrSellStringToTradeType = (str) => {
    str = str.toLowerCase();
    if (str === "buy") {
        return TradeType.LONG;
    }
    else if (str === "sell") {
        return TradeType.SHORT;
    }
    else {
        return null;
    }
};
exports.convertBuyOrSellStringToTradeType = convertBuyOrSellStringToTradeType;
//# sourceMappingURL=TradeType.js.map