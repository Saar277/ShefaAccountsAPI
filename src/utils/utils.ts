import { MinMaxBar } from "../models/Bar/MinMaxBar";
import Bar from "../models/Bar/Bar";
import { TradeType } from "../models/TradeType";
import { MinMaxType } from "../models/Bar/MinMaxBar";
import { Trade } from "../models/Trade";
import { AccountInfo } from "../models/AccountInfo";
import { StrategyType } from "../models/strategiesTypes";
import e from "express";

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
  tradeType: TradeType,
  originalStopLossPrice: number,
  account?: AccountInfo
): Trade => {
  const entryPrice: number = calculateAvgPrice(entries);
  const closePrice: number = calculateAvgPrice(exits);

  const pNl = calclautePnL(entryPrice, closePrice, tradeType, qty);

  const trade: Trade = {
    symbol: symbol,
    type: tradeType,
    qty: qty,
    entryPrice: entryPrice,
    entryTime: new Date(entries[0].date),
    pNl: pNl,
    percentPnL: calclautePercentagePnL(entryPrice, closePrice, tradeType),
    closePrice: closePrice,
    closeTime: new Date(exits[exits.length - 1].date),
    entries: entries,
    exits: exits,
  };

  if (originalStopLossPrice) {
    trade.stopLosses = [
      {
        price: originalStopLossPrice,
        qty: qty,
      },
    ];
  }

  const ratio = getTradeRatio(
    pNl,
    originalStopLossPrice,
    tradeType,
    entryPrice,
    qty,
    account
  );

  if (ratio) {
    trade.ratio = ratio;
  }

  return trade;
};

export const getTradeRatio = (
  pNl: number,
  originalStopLossPrice: number,
  tradeType: TradeType,
  entryPrice: number,
  qty: number,
  account: AccountInfo
): number => {
  if (pNl > 0) {
    if (originalStopLossPrice) {
      return (
        pNl /
        ((tradeType === TradeType.LONG
          ? entryPrice - originalStopLossPrice
          : originalStopLossPrice - entryPrice) *
          qty)
      );
    } else if (
      account &&
      account.strategy &&
      account.strategy === StrategyType.FIFTEEN_MIN_TSLA_FROM_GUETA
    ) {
      return pNl / ((entryPrice - originalStopLossPrice) * qty);
    }
  }

  return null;
};

export const mapAccountValueInDateToPnlInEveryDay = (
  accountValuesInDates: { value: number; date: Date }[]
): { date: Date; pNl: number }[] => {
  let index = 0;
  return accountValuesInDates.map((accountValuesInDate) => {
    const pNlFromLastDay =
      accountValuesInDate.value -
      (accountValuesInDates[index - 1]
        ? accountValuesInDates[index - 1].value
        : 0);

    index++;

    return {
      date: accountValuesInDate.date,
      pNl: pNlFromLastDay,
    };
  });
};

export const mapAccountValueInDateToPnlInEveryMonth = (
  accountValuesInDates: { value: number; date: Date }[]
): { date: Date; pNl: number }[] => {
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
): { date: Date; pNl: number }[] => {
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

const calculateSmaByBars = (bars: Bar[], smaLength: number): number => {
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

export const getSmaValuesFromBars = (
  bars: Bar[],
  smaLength: number
): { date: Date; value: number }[] => {
  const passedBars: Bar[] = [];
  const smaValues: { date: Date; value: number }[] = [];

  for (let bar of bars) {
    passedBars.push(bar);
    smaValues.push({
      date: bar.time,
      value: calculateSmaByBars(passedBars, smaLength),
    });
  }

  return smaValues;
};

export const findLocalMinimaMaximaIndices = (
  bars: Bar[],
  window: number = 1
): { minima: MinMaxBar[]; maxima: MinMaxBar[] } => {
  const minima: MinMaxBar[] = [];
  const maxima: MinMaxBar[] = [];

  for (let i = window; i < bars.length - window; i++) {
    const windowSlice = bars.slice(i - window, i + window + 1);

    const currentBar = bars[i];

    const isMinima = windowSlice.every(
      (val) => currentBar.closePrice <= val.closePrice
    );
    const isMaxima = windowSlice.every(
      (val) => currentBar.closePrice >= val.closePrice
    );

    if (isMinima) {
      minima.push({
        ...currentBar,
        type: MinMaxType.MINIMA,
        pricePoint:
          currentBar.closePrice > currentBar.openPrice
            ? currentBar.openPrice
            : currentBar.closePrice,
      });
    } else if (isMaxima) {
      maxima.push({
        ...currentBar,
        type: MinMaxType.MAXIMA,
        pricePoint:
          currentBar.closePrice < currentBar.openPrice
            ? currentBar.openPrice
            : currentBar.closePrice,
      });
    }
  }

  return { minima, maxima };
};
