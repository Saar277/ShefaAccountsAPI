import AlpacaBrokerAPI from "./AlpacaBrokerAPI";
import IBrokerAPI from "./IBrokerAPI";
import { accountsInfo } from "../env";
import { Position } from "../models/Position";
import { TradeType } from "../models/TradeType";
import Statistics from "../models/Statistics";
import {
  mapAccountValueInDateToPnlInEveryMonth,
  mapAccountValueInDateToPnlInEveryYear,
  filterTradesByTimeRange,
  getSmaValuesFromBars,
} from "../utils/utils";
import e from "express";
import Bar from "../models/Bar";

export class Accounts {
  private static accounts: { iBrokerAPI: IBrokerAPI; name: string }[] =
    this.intalizeAccounts();

  public static getAccounts() {
    return this.accounts;
  }

  public static intalizeAccounts(): { iBrokerAPI: IBrokerAPI; name: string }[] {
    return accountsInfo.map((accountInfo) => {
      return {
        iBrokerAPI: new AlpacaBrokerAPI(
          accountInfo.API_KEY,
          accountInfo.API_SECRET
        ),
        name: accountInfo.NAME,
      };
    });
  }

  public static async getAccountsPositions(): Promise<
    { accountName: string; positions: Position[] }[]
  > {
    return await Promise.all(
      this.accounts.map(async (account) => {
        return {
          accountName: account.name,
          positions: await account.iBrokerAPI.getPositions(),
        };
      })
    );
  }

  public static async getAccountsValuesHistory(): Promise<
    {
      accountName: string;
      accountValuesHistory: {
        value: number;
        date: Date;
      }[];
    }[]
  > {
    return await Promise.all(
      this.accounts.map(async (account) => {
        return {
          accountName: account.name,
          accountValuesHistory:
            await account.iBrokerAPI.getAccountValuesHistory(),
        };
      })
    );
  }

  public static async getAccountValuesHistory(
    accountName: string
  ): Promise<{ value: number; date: Date }[]> {
    return await this.accounts
      .find((account) => account.name === accountName)
      .iBrokerAPI.getAccountValuesHistory();
  }

  public static async getAccountValuesHistoryInDatesRange(
    accountName: string,
    startDateInMilliseconds: number,
    endDateInMilliseconds: number
  ): Promise<{ value: number; date: Date }[]> {
    return (
      await this.accounts
        .find((account) => account.name === accountName)
        .iBrokerAPI.getAccountValuesHistory()
    ).filter((valueInDate) => {
      const valueInDateMilliseconds = valueInDate.date.getTime();

      return (
        valueInDateMilliseconds >= startDateInMilliseconds &&
        valueInDateMilliseconds <= endDateInMilliseconds
      );
    });
  }

  public static async getAccountPnlInEveryMonthOrYear(
    accountName: string,
    monthOrYear: "month" | "year" | string
  ): Promise<{ date: Date; pNl: number }[]> {
    const accountValuesInDates = await this.accounts
      .find((account) => account.name === accountName)
      .iBrokerAPI.getAccountValuesHistory();

    return monthOrYear === "month"
      ? mapAccountValueInDateToPnlInEveryMonth(accountValuesInDates)
      : mapAccountValueInDateToPnlInEveryYear(accountValuesInDates);
  }

  public static async getClosedTrades() {
    return Promise.all(
      this.accounts.map(async (account) => {
        return {
          accountName: account.name,
          trades: await account.iBrokerAPI.getClosedTrades(),
        };
      })
    );
  }

  public static async getClosedTradesForAccount(accountName: string) {
    return await this.accounts
      .find((account) => account.name === accountName)
      .iBrokerAPI.getClosedTrades();
  }

  private static async getStartMoneyAmount(
    accountName: string
  ): Promise<number> {
    return (
      await this.accounts
        .find((account) => account.name === accountName)
        .iBrokerAPI.getAccountValuesHistory()
    )[0].value;
  }

  private static async getMoneyAmount(accountName: string): Promise<number> {
    return await this.accounts
      .find((account) => account.name === accountName)
      .iBrokerAPI.getMoneyAmount();
  }

  public static async getAccountTradesStatistics(
    accountName: string
  ): Promise<Statistics> {
    const trades = await this.accounts
      .find((account) => account.name === accountName)
      .iBrokerAPI.getClosedTrades();

    const startMoneyAmount: number = await this.getStartMoneyAmount(
      accountName
    );
    const moneyAmount: number = await this.getMoneyAmount(accountName);
    const pNl: number = moneyAmount - startMoneyAmount;

    const winningTrades = trades.filter(
      (trade: { pNl: number }) => trade.pNl > 0
    );
    const avgWinningTrade: number = this.getAvgWinningTrade(winningTrades);
    const avgLosingTrade: number = this.getAvgLosingTrade(trades);

    const longTradesPrecentage: number =
      (trades.filter(
        (trade: { type: TradeType }) => trade.type === TradeType.LONG
      ).length /
        trades.length) *
      100;

    return {
      startMoneyAmount: startMoneyAmount,
      moneyAmount: moneyAmount,
      pNl: pNl,
      percentPNl: (pNl / startMoneyAmount) * 100,
      winningTradesCount: winningTrades.length,
      losingTradesCount: trades.length - winningTrades.length,
      successRate: (winningTrades.length / trades.length) * 100,
      avgWinningTrade: avgWinningTrade,
      avgLosingTrade: avgLosingTrade,
      ratio: avgWinningTrade / avgLosingTrade,
      largestWinningTrade: Math.max(
        ...trades.map((trade: { pNl: any }) => trade.pNl)
      ),
      largestLosingTrade: Math.min(
        ...trades.map((trade: { pNl: any }) => trade.pNl)
      ),
      longPrecentage: longTradesPrecentage,
      shortPrecentage: 100 - longTradesPrecentage,
    };
  }

  public static async getAccountTradesStatisticsInTimeRange(
    accountName: string,
    startDateInMilliseconds: number,
    endDateInMilliseconds: number
  ): Promise<Statistics> {
    const trades = filterTradesByTimeRange(
      await this.accounts
        .find((account) => account.name === accountName)
        .iBrokerAPI.getClosedTrades(),
      startDateInMilliseconds,
      endDateInMilliseconds
    );

    const valuesHistory = await this.getAccountValuesHistoryInDatesRange(
      accountName,
      startDateInMilliseconds,
      endDateInMilliseconds
    );
    const startMoneyAmount: number = valuesHistory[0].value;
    const moneyAmount: number = valuesHistory[valuesHistory.length - 1].value;
    const pNl: number = moneyAmount - startMoneyAmount;

    const winningTrades = trades.filter(
      (trade: { pNl: number }) => trade.pNl > 0
    );
    const avgWinningTrade: number = this.getAvgWinningTrade(winningTrades);
    const avgLosingTrade: number = this.getAvgLosingTrade(trades);

    const longTradesPrecentage: number =
      (trades.filter(
        (trade: { type: TradeType }) => trade.type === TradeType.LONG
      ).length /
        trades.length) *
      100;

    return {
      startMoneyAmount: startMoneyAmount,
      moneyAmount: moneyAmount,
      pNl: pNl,
      percentPNl: (pNl / startMoneyAmount) * 100,
      winningTradesCount: winningTrades.length,
      losingTradesCount: trades.length - winningTrades.length,
      successRate: (winningTrades.length / trades.length) * 100,
      avgWinningTrade: avgWinningTrade,
      avgLosingTrade: avgLosingTrade,
      ratio: avgWinningTrade / avgLosingTrade,
      largestWinningTrade: Math.max(
        ...trades.map((trade: { pNl: any }) => trade.pNl)
      ),
      largestLosingTrade: Math.min(
        ...trades.map((trade: { pNl: any }) => trade.pNl)
      ),
      longPrecentage: longTradesPrecentage,
      shortPrecentage: 100 - longTradesPrecentage,
    };
  }

  private static getAvgWinningTrade(winningTrades: any[]): number {
    let sum = 0;
    winningTrades.forEach((trade) => {
      sum += trade.pNl;
    });

    return sum / winningTrades.length;
  }

  private static getAvgLosingTrade(trades: any[]): number {
    const losingTrades = trades.filter((trade) => trade.pNl < 0);
    let sum = 0;
    losingTrades.forEach((trade) => (sum += trade.pNl));

    return Math.abs(sum) / losingTrades.length;
  }

  public static getAccountsOrdersSymbols() {
    return Promise.all(
      this.accounts.map(async (account) => {
        return {
          accountName: account.name,
          symbols: await account.iBrokerAPI.getAllOrdersSymbols(),
        };
      })
    );
  }

  public static async getAccountOrdersSymbols(accountName: string) {
    return await this.accounts
      .find((account) => account.name === accountName)
      .iBrokerAPI.getAllOrdersSymbols();
  }

  public static getAccountsNames() {
    return this.accounts.map((account) => account.name);
  }

  public static async getBarsWithOrders(
    accountName: string,
    symbol: string,
    timeFrame: number,
    timeFrameUnit: string
  ) {
    try {
      const account = this.accounts.find(
        (account) => account.name === accountName
      );
      const orders = await account.iBrokerAPI.getOrdersBySymbol(symbol);

      const fiveDaysInMilliseconds: number = 432000000;
      const startDate = new Date(
        orders[0].date.getTime() - fiveDaysInMilliseconds
      ).toISOString();
      const bars = await account.iBrokerAPI.getBars(
        symbol,
        timeFrame,
        timeFrameUnit,
        true,
        startDate
      );

      return {
        orders: orders,
        bars: bars,
      };
    } catch (error) {
      console.log(error);
    }
  }

  public static async getBarsWithOrdersWithSma(
    accountName: string,
    symbol: string,
    timeFrame: number,
    timeFrameUnit: string,
    smaLength: number
  ) {
    try {
      const account = this.accounts.find(
        (account) => account.name === accountName
      );
      const orders = await account.iBrokerAPI.getOrdersBySymbol(symbol);

      const fiveDaysInMilliseconds: number = 432000000;
      const startDate = new Date(
        orders[0].date.getTime() - fiveDaysInMilliseconds
      ).toISOString();
      const bars: Bar[] = await account.iBrokerAPI.getBars(
        symbol,
        timeFrame,
        timeFrameUnit,
        true,
        startDate
      );

      return {
        orders: orders,
        bars: bars,
        smaValues: getSmaValuesFromBars(bars, smaLength)
      };
    } catch (error) {
      console.log(error);
    }
  }
}
