import Alpaca from "@alpacahq/alpaca-trade-api";
import {
  AlpacaBar,
  TimeFrameUnit,
} from "@alpacahq/alpaca-trade-api/dist/resources/datav2/entityv2";
import IBrokerAPI from "./IBrokerAPI";
import Bar from "../models/Bar";
import { Position } from "@src/models/Position";
import {
  calclautePercentagePnL,
  createTradeFromOrdersData,
} from "@src/utils/utils";
import {
  TradeType,
  convertBuyOrSellStringToTradeType,
  getTradeTypeFromString,
} from "@src/models/TradeType";
import { Trade } from "@src/models/Trade";

class AlpacaBrokerAPI implements IBrokerAPI {
  static baseUrl = "https://paper-api.alpaca.markets"; // Use the paper trading base URL for testing

  private alpaca!: Alpaca;
  private apiKey: string;
  private apiSecret: string;

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.connect();
  }

  connect(): void {
    this.alpaca = new Alpaca({
      keyId: this.apiKey,
      secretKey: this.apiSecret,
      baseUrl: AlpacaBrokerAPI.baseUrl,
      paper: true, // Set to true for paper trading
    });
  }

  disconnect(): Promise<any> {
    return new Promise<any>((resolve) => resolve(true));
    // Implement disconnection logic for Alpaca
    // For example: this.alpaca.close();
  }

  async getAccount(): Promise<any> {
    return this.alpaca.getAccount();
  }

  async getClock(): Promise<any> {
    return this.alpaca.getClock();
  }

  async getBars(
    symbol: string,
    timeFrame: number,
    timeFrameUnit: TimeFrameUnit,
    onlyMarketHours: boolean,
    startDate: string,
    endDate?: string
  ): Promise<Bar[]> {
    const bars = await this.alpaca.getBarsV2(symbol, {
      start: startDate,
      end: endDate,
      timeframe: this.alpaca.newTimeframe(timeFrame, timeFrameUnit),
    });

    let historicalData: AlpacaBar[] = [];

    for await (let bar of bars) {
      bar.Timestamp = new Date(bar.Timestamp).toLocaleString("en-GB", {
        timeZone: "America/New_York",
      });
      historicalData.push(bar);
    }

    historicalData = onlyMarketHours
      ? await this.filterBarsOnlyMarketHours(historicalData, timeFrame)
      : historicalData;
    return await this.convertAlpacaBarsToBars(historicalData);
  }

  async createMarketOrder(
    symbol: string,
    qty: number,
    side: "buy" | "sell"
  ): Promise<any> {
    return this.alpaca.createOrder({
      symbol,
      qty,
      side,
      type: "market",
      time_in_force: "gtc",
    });
  }

  async createLimitOrder(
    symbol: string,
    qty: number,
    side: "buy" | "sell",
    limitPrice: number
  ): Promise<any> {
    return this.alpaca.createOrder({
      symbol,
      qty,
      side,
      type: "limit",
      time_in_force: "gtc",
      limit_price: limitPrice,
    });
  }

  async createStopOrder(
    symbol: string,
    qty: number,
    side: "buy" | "sell",
    stopPrice: number
  ): Promise<any> {
    return this.alpaca.createOrder({
      symbol,
      qty,
      side,
      type: "stop",
      time_in_force: "gtc",
      stop_price: stopPrice,
    });
  }

  async createStopLimitOrder(
    symbol: string,
    qty: number,
    side: "buy" | "sell",
    limitPrice: number,
    stopPrice: number
  ): Promise<any> {
    return this.alpaca.createOrder({
      symbol,
      qty,
      side,
      type: "stop_limit",
      time_in_force: "gtc",
      limit_price: limitPrice,
      stop_price: stopPrice,
    });
  }

  async createTrailingStopOrder(
    symbol: string,
    qty: number,
    side: "buy" | "sell",
    trailPrice: number,
    trailPercent: number
  ): Promise<any> {
    return this.alpaca.createOrder({
      symbol,
      qty,
      side,
      type: "trailing_stop",
      time_in_force: "gtc",
      trail_price: trailPrice,
      trail_percent: trailPercent,
    });
  }

  async createTakeProfitOrder(
    symbol: string,
    qty: number,
    side: "buy" | "sell",
    limitPrice: number
  ): Promise<any> {
    return this.alpaca.createOrder({
      symbol,
      qty,
      side,
      type: "take_profit",
      time_in_force: "gtc",
      limit_price: limitPrice,
    });
  }

  async createEntryPriceWithStopLossAndTargetOrder(
    symbol: string,
    qty: number,
    side: "buy" | "sell",
    entryPrice: number,
    stopLossPrice: number,
    stopLossQty: number,
    takeProfitPrice: number,
    takeProfitQty: number
  ): Promise<any> {
    //A workaround is to submit several braket orders. As an example, if one wanted to buy 10 shares, but new ahead of time one wanted to first sell 50 shares, then 25, then 25 more, simply submit 3 bracket orders for 50, 25, and 25 shares respectively. Each can have different stop loss and limit prices.

    //MAIN ORDER
    await this.alpaca.createOrder({
      symbol: symbol,
      qty: qty * 0.5,
      side: side,
      type: "stop",
      stop_price: 172,
      time_in_force: "gtc",
      order_class: "bracket",
      stop_loss: {
        stop_price: 100,
        time_in_force: "gtc",
      },
      take_profit: {
        limit_price: 200,
        time_in_force: "gtc",
      },
    });

    await this.alpaca.createOrder({
      symbol: symbol,
      qty: qty * 0.5,
      side: side,
      type: "stop",
      stop_price: 172,
      time_in_force: "gtc",
      order_class: "bracket",
      stop_loss: {
        stop_price: 100,
        time_in_force: "gtc",
      },
      take_profit: {
        limit_price: 100000000,
        time_in_force: "gtc",
      },
    });

    // // Take Profit Order
    // await this.alpaca.createOrder({
    //   symbol: symbol,
    //   qty: takeProfitPrice,
    //   side: (side == "buy") ? "sell" : "buy",
    //   type: "limit",
    //   limit_price: 180,
    //   time_in_force: "gtc"
    // })

    // // Stop Loss Order
    // await this.alpaca.createOrder({
    //   symbol: symbol,
    //   qty: stopLossQty,
    //   side: (side === "buy") ? "sell" : "buy",
    //   type: "stop",
    //   stop_price: stopLossPrice,
    //   time_in_force: "gtc"
    // });
  }

  async getOpenOrders(symbol?: string): Promise<any[]> {
    const filter: any = { status: "open", symbol };
    return this.alpaca.getOrders(filter);
  }

  async getCash(): Promise<number> {
    const account = await this.alpaca.getAccount();
    return account.cash;
  }

  async getPositions(): Promise<Position[]> {
    const positions = await this.alpaca.getPositions();

    return positions.length !== 0
      ? positions.map((position) => {
          const tradeType: TradeType = getTradeTypeFromString(position.side);

          return {
            symbol: position.symbol,
            type: tradeType,
            qty: position.qty,
            entryPrice: position.avg_entry_price,
            pNl: position.unrealized_pl,
            percentPnL: calclautePercentagePnL(
              position.avg_entry_price,
              position.current_price,
              tradeType
            ),
            dailyPnl: position.unrealized_intraday_pl,
            currentStockPrice: position.current_price,
            netLiquidation: Math.abs(position.current_price * position.qty),
          };
        })
      : [];
  }

  async getPosition(symbol: string): Promise<any | null> {
    try {
      return await this.alpaca.getPosition(symbol);
    } catch (error: any) {
      if (error === 404) {
        // Position not found
        return null;
      }
      // throw error;
    }
  }

  async isInPosition(symbol: string): Promise<boolean> {
    const positions: any[] = await this.alpaca.getPositions();
    return positions.some((position) => position.symbol === symbol);
  }

  async getAccountValuesHistory(): Promise<{ value: number; date: Date }[]> {
    const accountValuesHistory: { value: number; date: Date }[] = [];

    const protofolioHistory = await this.alpaca.getPortfolioHistory({
      period: "5A",
      timeframe: "1D",
      date_start: "",
      date_end: "",
      extended_hours: "",
    });

    protofolioHistory.equity.forEach((value: number, index: number) => {
      if (value !== 0) {
        accountValuesHistory.push({
          value: value,
          date: new Date(protofolioHistory.timestamp[index] * 1000),
        });
      }
    });

    return accountValuesHistory;
  }

  async getClosedTrades() {
    const orders = this.sortOrdersBySymbol(await this.fetchAllClosedOrders());
    return this.createTradesFromOrders(orders);
  }

  async fetchAllClosedOrders() {
    const fiveDaysInMilliseconds: number = 432000000;
    let allOrders = [];

    let orders = [];
    let index = 1;

    while (orders.length !== 0 || index == 1) {
      orders = await this.alpaca.getOrders({
        status: "closed",
        limit: 500, //the limit of the api,
        after: new Date(
          new Date().getTime() - fiveDaysInMilliseconds * index
        ).toISOString(),
        until: new Date(
          new Date().getTime() - fiveDaysInMilliseconds * (index - 1)
        ).toISOString(),
        direction: "desc",
        nested: "false",
        symbols: "",
      });

      allOrders = allOrders.concat(orders);
      index++;
    }

    return allOrders.filter((order) => parseInt(order.filled_qty) > 0).reverse();
  }

  sortOrdersBySymbol(orders: any[]) {
    return orders.sort((a, b) => {
      const nameA = a.symbol.toUpperCase(); // ignore upper and lowercase
      const nameB = b.symbol.toUpperCase(); // ignore upper and lowercase
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }

      // names must be equal
      return 0;
    });
  }

  createTradesFromOrders(orders: any[]) {
    const closedTrades = [];

    let symbol: string = "";
    let entries: any[] = [];
    let exits: any[] = [];
    let entryQty: number = 0;
    let exitQty: number = 0;
    let tradeType: TradeType = null;

    orders.forEach((order) => {
      const qty: number = parseInt(order.filled_qty);

      if (entryQty === 0 || symbol != order.symbol) {
        symbol = order.symbol;
        entries = [{
          price: order.filled_avg_price,
          qty: qty,
          date: order.filled_at,
        }];
        entryQty = qty;
        tradeType = convertBuyOrSellStringToTradeType(order.side);
      } else {
        if (convertBuyOrSellStringToTradeType(order.side) === tradeType) {
          entries.push({
            price: order.filled_avg_price,
            qty: qty,
            date: order.filled_at,
          });
          entryQty += qty;
        } else {
          exits.push({
            price: order.filled_avg_price,
            qty: qty,
            date: order.filled_at,
          });
          exitQty += qty;

          if (entryQty === exitQty) {
            closedTrades.push(
              createTradeFromOrdersData(
                symbol,
                entries,
                exits,
                entryQty,
                tradeType
              )
            );
            symbol = "";
            entries = [];
            exits = [];
            entryQty = 0;
            exitQty = 0;
            tradeType = null;
          }
        }
      }
    });

    return closedTrades;
  }

  async convertAlpacaBarsToBars(bars: AlpacaBar[]): Promise<Bar[]> {
    return bars.map((bar) => ({
      openPrice: bar.OpenPrice,
      closePrice: bar.ClosePrice,
      highPrice: bar.HighPrice,
      lowPrice: bar.LowPrice,
      time: new Date(bar.Timestamp), //TODO: CHECK IF WORKING
    }));
  }

  async filterBarsOnlyMarketHours(
    bars: AlpacaBar[],
    timeframe: number
  ): Promise<AlpacaBar[]> {
    return bars.filter((bar) => {
      const time = bar.Timestamp.substring(12);
      const hour: number = +time.substring(0, 2);
      const minute: number = +time.substring(3, 5);

      return this.isTimeBetween(9, 30, 15, 60 - timeframe, hour, minute);
    });
  }

  public getDateInApiFormat(date: Date): string {
    const year: string = date.getFullYear().toString();
    let month: string = (date.getMonth() + 1).toString();
    month = month.length == 1 ? `0${month}` : month;
    let day: string = date.getDate().toString();
    day = day.length == 1 ? `0${day}` : day;

    return [year, month, day].join("-");
  }

  public async isClockOpen(): Promise<boolean> {
    const clock: any = await this.getClock();
    return clock.is_open;
  }

  closePosition(symbol: string): void {
    this.alpaca.closePosition(symbol);
  }

  isTimeBetween(
    startHour: number,
    startMinute: number,
    endHour: number,
    endMinute: number,
    targetHour: number,
    targetMinute: number
  ): boolean {
    // Convert all times to minutes for easier comparison
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;
    const targetTimeInMinutes = targetHour * 60 + targetMinute;

    return (
      targetTimeInMinutes >= startTimeInMinutes &&
      targetTimeInMinutes <= endTimeInMinutes
    );
  }
}

export default AlpacaBrokerAPI;
