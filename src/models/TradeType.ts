export enum TradeType {
  LONG = "LONG",
  SHORT = "SHORT",
}

export const getTradeTypeFromString = (str: string) => {
  str = str.toLowerCase();

  if (str === TradeType.LONG.toLowerCase()) {
    return TradeType.LONG;
  } else if (str === TradeType.SHORT.toLowerCase()) {
    return TradeType.SHORT;
  } else {
    return null;
  }
};

export const convertBuyOrSellStringToTradeType = (str: string) => {
  str = str.toLowerCase();

  if (str === "buy") {
    return TradeType.LONG;
  } else if (str === "sell") {
    return TradeType.SHORT;
  } else {
    return null;
  }
};
