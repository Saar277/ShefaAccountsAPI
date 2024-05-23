import { TradeType } from "../models/TradeType";

export const calclautePercentagePnL = (
  entryPrice: number,
  closePrice: number,
  tradeType: TradeType
): number => {
  return (
    (tradeType === TradeType.LONG
      ? (closePrice - entryPrice) / entryPrice
      : (entryPrice - closePrice) / closePrice) * 100
  );
};

const calclautePnL = (
  entryPrice: number,
  closePrice: number,
  tradeType: TradeType,
  qty: number
) => {
  return (
    (tradeType === TradeType.LONG
      ? closePrice - entryPrice
      : entryPrice - closePrice) * qty
  );
};

const calculateAvgPrice = (priceAndQty: { price: number; qty: number }[]) => {
  let totalCost = 0;
  let totalQty = 0;

  for (const item of priceAndQty) {
    totalCost += item.price * item.qty;
    totalQty += item.qty;
  }

  return totalQty === 0 ? 0 : totalCost / totalQty;
};

export const createTradeFromOrdersData = (
  symbol: string,
  entries: any[],
  exits: any[],
  qty: number,
  tradeType: TradeType
) => {
  const entryPrice: number = calculateAvgPrice(entries);
  const closePrice: number = calculateAvgPrice(exits);

  return {
    symbol: symbol,
    type: tradeType,
    qty: qty,
    entryPrice: entryPrice,
    entryTime: new Date(entries[0].date),
    pNl: calclautePnL(entryPrice, closePrice, tradeType, qty),
    percentPnL: calclautePercentagePnL(entryPrice, closePrice, tradeType),
    closePrice: closePrice,
    closeTime: new Date(exits[exits.length - 1].date),
    entries: entries,
    exits: exits,
  };
};
