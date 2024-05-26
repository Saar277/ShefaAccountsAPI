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

export const mapAccountValueInDateToPnlInEveryMonth = (
  accountValuesInDates: { value: number; date: Date }[]
) => {
  return Object.values(
    accountValuesInDates.reduce((acc: any, obj: any) => {
      // Extract the month and year from the date
      const date = new Date(obj.date);
      const month = date.getMonth(); // Months are 0-indexed
      const year = date.getFullYear();
      const monthYear: string = `${year}-${month + 1}`; // Create a string to represent the month and year

      // If the monthYear key doesn't exist, create an array for it
      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }

      // Add the object to the respective monthYear array
      acc[monthYear].push(obj);

      return acc;
    }, {})
  ).map((array: any) => {
    const firstValueInMonth = array[0].value;
    const lastValueInMonth = array[array.length - 1].value;

    return {
      date: array[0].date,
      pNl: lastValueInMonth - firstValueInMonth,
    };
  });
};

export const mapAccountValueInDateToPnlInEveryYear = (
  accountValuesInDates: { value: number; date: Date }[]
) => {
  return Object.values(
    accountValuesInDates.reduce((acc: any, obj: any) => {
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
    }, {})
  ).map((array: any) => {
    const firstValueInYear = array[0].value;
    const lastValueInYear = array[array.length - 1].value;

    return {
      date: array[0].date,
      pNl: lastValueInYear - firstValueInYear,
    };
  });
};

export const filterTradesByTimeRange = (
  trades: any,
  startDateInMilliseconds: number,
  endDateInMilliseconds: number
) => {
  return trades.filter(
    (trade: any) =>
      trade.closeTime.getTime() >= startDateInMilliseconds &&
      trade.closeTime.getTime() <= endDateInMilliseconds
  );
};
