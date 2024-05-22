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
