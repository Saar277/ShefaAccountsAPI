import AlpacaBrokerAPI from "./AlpacaBrokerAPI";
import IBrokerAPI from "./IBrokerAPI";
import { accountsInfo } from "../env";
import { Position } from "../models/Position";
import { TradeType } from "../models/TradeType";
import Statistics from "../models/Statistics";

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

  public static async getAccountValuesHistory(): Promise<
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

    const winningTrades = trades.filter((trade: { pNl: number; }) => trade.pNl > 0);
    const avgWinningTrade: number = this.getAvgWinningTrade(winningTrades);
    const avgLosingTrade: number = this.getAvgLosingTrade(trades);

    const longTradesPrecentage: number =
      (trades.filter((trade: { type: TradeType; }) => trade.type === TradeType.LONG).length /
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
      largestWinningTrade: Math.max(...trades.map((trade: { pNl: any; }) => trade.pNl)),
      largestLosingTrade: Math.min(...trades.map((trade: { pNl: any; }) => trade.pNl)),
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

  public static getAccountsNames() {
    return this.accounts.map(account => account.name);
  }

  public static async getBarsWithOrders(accountName: string, symbol: string, timeFrame: number, timeFrameUnit: string) {
    try {
      const account = this.accounts.find(account => account.name === accountName);
      const orders = await account.iBrokerAPI.getOrdersBySymbol(symbol);
  
      const fiveDaysInMilliseconds: number = 432000000;
      const startDate = new Date(orders[0].date.getTime() - fiveDaysInMilliseconds).toISOString();
      const bars = await account.iBrokerAPI.getBars(symbol, timeFrame, timeFrameUnit, true, startDate);

      return {
        orders: orders,
        bars: bars
      }
    } catch (error) {
      console.log(error);
    }
  }
}
