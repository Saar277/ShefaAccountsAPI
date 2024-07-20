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
  findLocalMinimaMaximaIndices,
  mapAccountValueInDateToPnlInEveryDay,
} from "../utils/utils";
import { AccountInfo } from "../models/AccountInfo";
import { Trade } from "../models/Trade";

export class Accounts {
  private static accounts: AccountInfo[] = this.intalizeAccounts();

  public static getAccounts() {
    return this.accounts;
  }

  public static intalizeAccounts(): any[] {
    return accountsInfo.map((accountInfo) => {
      return {
        iBrokerAPI: new AlpacaBrokerAPI(
          accountInfo.API_KEY,
          accountInfo.API_SECRET
        ),
        name: accountInfo.NAME,
        strategy: accountInfo.STRATEGY,
        defaultStopLossPercentInTrade:
          accountInfo.DEFAULT_STOP_LOSS_PERCENT_IN_TRADE,
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
          positions: await account.iBrokerAPI.getPositionsForStrategy(account),
        };
      })
    );
  }

  public static async getAccountPositions(
    accountName: string
  ): Promise<Position[]> {
    const account = this.accounts.find(
      (account) => account.name === accountName
    );

    return await account.iBrokerAPI.getPositionsForStrategy(account);
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

  public static async getAccountPnlInEveryMonthOrYearOrDay(
    accountName: string,
    monthOrYearOrDay: "month" | "year" | "day" | string
  ): Promise<{ date: Date; pNl: number }[]> {
    const accountValuesInDates = await this.accounts
      .find((account) => account.name === accountName)
      .iBrokerAPI.getAccountValuesHistory();

    if (monthOrYearOrDay === "month") {
      return mapAccountValueInDateToPnlInEveryMonth(accountValuesInDates);
    } else if (monthOrYearOrDay === "year") {
      return mapAccountValueInDateToPnlInEveryYear(accountValuesInDates);
    } else if (monthOrYearOrDay === "day") {
      return mapAccountValueInDateToPnlInEveryDay(
        accountValuesInDates
      ).reverse();
    }
  }

  public static async getClosedTrades() {
    return Promise.all(
      this.accounts.map(async (account) => {
        return {
          accountName: account.name,
          trades: await account.iBrokerAPI.getClosedTrades(account),
        };
      })
    );
  }

  public static async getClosedTradesForAccount(accountName: string) {
    const account = this.accounts.find(
      (account) => account.name === accountName
    );

    return await account.iBrokerAPI.getClosedTrades(account);
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

  public static async getAccountsTradesStatistics() {
    return Promise.all(
      this.accounts.map(async (account) => {
        return {
          accountName: account.name,
          statistics: await this.getAccountTradesStatistics(account.name),
        };
      })
    );
  }

  public static async getAccountTradesStatistics(
    accountName: string
  ): Promise<Statistics> {
    const trades = await this.getClosedTradesForAccount(accountName);

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
      realizedPnL: trades.reduce(
        (sum: number, trade: Trade) => sum + trade.pNl,
        0
      ),
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
      startDate: trades[trades.length - 1]?.entryTime,
    };
  }

  public static async getAccountTradesStatisticsForSymbol(
    accountName: string,
    symbol: string
  ): Promise<Statistics> {
    const trades = (await this.getClosedTradesForAccount(accountName)).filter(
      (trade: Trade) => trade.symbol === symbol
    );

    const startMoneyAmount: number = await this.getStartMoneyAmount(
      accountName
    );

    const realizedPnL: number = trades.reduce(
      (sum: number, trade: Trade) => sum + trade.pNl,
      0
    );
    const account = this.accounts.find(
      (account) => account.name === accountName
    );
    const position = await account.iBrokerAPI.getPositionForStrategy(
      symbol,
      account
    );

    const pNl: number = position
      ? position.overAllPnL
        ? realizedPnL + position.overAllPnL
        : realizedPnL + position.pNl
      : realizedPnL;

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
      pNl: pNl,
      percentPNl: (pNl / startMoneyAmount) * 100,
      realizedPnL: realizedPnL,
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
      startDate: trades[trades.length - 1]?.entryTime,
      startMoneyAmount: undefined,
      moneyAmount: undefined,
    };
  }

  public static async getAccountTradesStatisticsPerSymbol(
    accountName: string
  ): Promise<
    {
      symbol: string;
      statistics: Statistics;
    }[]
  > {
    return (
      await Promise.all(
        (
          await this.getAccountOrdersSymbols(accountName)
        ).map(async (symbol) => {
          return {
            symbol: symbol,
            statistics: await this.getAccountTradesStatisticsForSymbol(
              accountName,
              symbol
            ),
          };
        })
      )
    ).filter(
      (statisticsPerSymbol) =>
        statisticsPerSymbol.statistics.winningTradesCount !== 0 ||
        statisticsPerSymbol.statistics.losingTradesCount !== 0
    );
  }

  public static async getAccountTradesStatisticsInTimeRange(
    accountName: string,
    startDateInMilliseconds: number,
    endDateInMilliseconds: number
  ): Promise<Statistics> {
    const trades = filterTradesByTimeRange(
      await this.getClosedTradesForAccount(accountName),
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
      realizedPnL: trades.reduce(
        (sum: number, trade: Trade) => sum + trade.pNl,
        0
      ),
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
      startDate: trades[trades.length - 1]?.entryTime,
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

  public static async getBarsWithOrdersAndStopLossesAndTakeProfits(
    accountName: string,
    symbol: string,
    timeFrame: number,
    timeFrameUnit: string,
    startDateInMilliseconds?: number
  ) {
    try {
      const account = this.accounts.find(
        (account) => account.name === accountName
      );

      const orders = await account.iBrokerAPI.getClosedOrdersBySymbol(
        symbol,
        startDateInMilliseconds
      );

      const fiveDaysInMilliseconds: number = 432000000;
      const startDate = startDateInMilliseconds
        ? new Date(startDateInMilliseconds).toISOString()
        : new Date(
            orders[0].date.getTime() - fiveDaysInMilliseconds
          ).toISOString();

      const bars = await account.iBrokerAPI.getBars(
        symbol,
        timeFrame,
        timeFrameUnit,
        true,
        startDate
      );

      const position = await account.iBrokerAPI.getPositionForStrategy(
        symbol,
        account
      );

      return {
        orders: orders,
        bars: bars,
        stopLosses: position?.stopLosses || [],
        takeProfits: position?.takeProfits || [],
      };
    } catch (error) {
      console.log(error);
    }
  }

  public static async getBarsWithOrdersWithSmaAndStopLossesAndTakeProfits(
    accountName: string,
    symbol: string,
    timeFrame: number,
    timeFrameUnit: string,
    smaLength: number,
    startDateInMilliseconds?: number
  ) {
    try {
      const { orders, bars, stopLosses, takeProfits } =
        await this.getBarsWithOrdersAndStopLossesAndTakeProfits(
          accountName,
          symbol,
          timeFrame,
          timeFrameUnit,
          startDateInMilliseconds
        );

      return {
        orders: orders,
        bars: bars,
        smaValues: getSmaValuesFromBars(bars, smaLength),
        stopLosses: stopLosses,
        takeProfits: takeProfits,
      };
    } catch (error) {
      console.log(error);
    }
  }

  public static async getBarsWithOrdersAndMinMaxPointsAndStopLossesAndTakeProfits(
    accountName: string,
    symbol: string,
    timeFrame: number,
    timeFrameUnit: string,
    rollingWindow: number,
    startDateInMilliseconds?: number
  ) {
    try {
      const { orders, bars, stopLosses, takeProfits } =
        await this.getBarsWithOrdersAndStopLossesAndTakeProfits(
          accountName,
          symbol,
          timeFrame,
          timeFrameUnit,
          startDateInMilliseconds
        );

      const { minima, maxima } = findLocalMinimaMaximaIndices(
        bars,
        rollingWindow
      );

      return {
        orders: orders,
        bars: bars,
        minPoints: minima.map((bar) => {
          return {
            pricePoint: bar.pricePoint,
            time: bar.time,
          };
        }),
        maxPoints: maxima.map((bar) => {
          return {
            pricePoint: bar.pricePoint,
            time: bar.time,
          };
        }),
        stopLosses: stopLosses,
        takeProfits: takeProfits,
      };
    } catch (error) {
      console.log(error);
    }
  }

  public static async getAllOrders() {
    return Promise.all(
      this.accounts.map(async (account) => {
        return {
          accountName: account.name,
          orders: await account.iBrokerAPI.getAllOrders(),
        };
      })
    );
  }

  public static async getAccountAllOrders(accountName: string) {
    return await this.accounts
      .find((account) => account.name === accountName)
      .iBrokerAPI.getAllOrders();
  }

  public static async getAccountAllOpenOrders(accountName: string) {
    return (
      await this.accounts
        .find((account) => account.name === accountName)
        .iBrokerAPI.getAllOrders()
    ).filter((order) => order.status === "open");
  }
}
