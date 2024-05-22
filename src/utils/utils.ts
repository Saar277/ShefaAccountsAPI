import { TradeType } from "@src/models/TradeType";

export const calclautePercentagePnL = (
  entryPrice: number,
  currentPrice: number,
  tradeType: TradeType
): number => {
  return (
    (tradeType === TradeType.LONG
      ? (currentPrice - entryPrice) / entryPrice
      : (entryPrice - currentPrice) / currentPrice) * 100
  );
};
