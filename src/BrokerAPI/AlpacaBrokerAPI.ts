import Alpaca from "@alpacahq/alpaca-trade-api";
import {
  AlpacaBar,
  TimeFrameUnit,
} from "@alpacahq/alpaca-trade-api/dist/resources/datav2/entityv2";
import IBrokerAPI from "./IBrokerAPI";
import Bar from "../models/Bar/Bar";
import { Position } from "../models/Position";
import {
  calclautePercentagePnL,
  createTradeFromOrdersData,
} from "../utils/utils";
import {
  TradeType,
  convertBuyOrSellStringToTradeType,
  getTradeTypeFromString,
} from "../models/TradeType";
import { uniq } from "lodash";
import moment from "moment-timezone";
import OrderPoint from "../models/orderPoint";
import { StrategyType } from "../models/strategiesTypes";
import { AccountInfo } from "../models/AccountInfo";
import { Trade } from "../models/Trade";

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

    historicalData =
      onlyMarketHours &&
      timeFrameUnit !== TimeFrameUnit.DAY &&
      timeFrameUnit !== TimeFrameUnit.MONTH &&
      timeFrameUnit !== TimeFrameUnit.WEEK
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

  async getMoneyAmount(): Promise<number> {
    return parseInt((await this.alpaca.getAccount()).portfolio_value);
  }

  async getLastOrder(symbol: string) {
    const twoMonthsInMilliseconds: number = 5259600000;

    return (
      await this.alpaca.getOrders({
        status: "closed",
        limit: 5, //the limit of the api,
        after: new Date(
          new Date().getTime() - twoMonthsInMilliseconds
        ).toISOString(),
        until: new Date(new Date().getTime()).toISOString(),
        direction: "desc",
        nested: "true",
        symbols: symbol !== undefined ? symbol : "",
      })
    ).find((order: { status: string }) => order.status === "filled");
  }

  async fetchAllOrders(symbol?: string) {
    const thirtyDaysInMilliseconds: number = 2592000000;
    let allOrders: any[] = [];

    let orders = [];
    let index = 1;

    while (orders.length !== 0 || index == 1) {
      orders = await this.alpaca.getOrders({
        status: "all",
        limit: 500, //the limit of the api,
        after: new Date(
          new Date().getTime() - thirtyDaysInMilliseconds * index
        ).toISOString(),
        until: new Date(
          new Date().getTime() - thirtyDaysInMilliseconds * (index - 1)
        ).toISOString(),
        direction: "desc",
        nested: "true",
        symbols: symbol !== undefined ? symbol : "",
      });

      allOrders = allOrders.concat(orders);
      index++;
    }

    return allOrders.filter((order) => order.status !== "canceled").reverse();
  }

  async getPositions(): Promise<Position[]> {
    const positions = await this.alpaca.getPositions();

    return positions.length !== 0
      ? positions
          .map((position: any) => {
            return this.convertAlpacaPositionToPosition(position);
          })
          .sort((a: { pNl: number }, b: { pNl: number }) => b.pNl - a.pNl)
      : [];
  }

  async getFifteenMinTSLAFromGuetaStratgeyPositions(
    stopLossPercent: number
  ): Promise<Position[]> {
    const positions = await this.alpaca.getPositions();

    return positions.length !== 0
      ? (
          await Promise.all(
            positions.map(async (position: any) => {
              return await this.addDataToFifteenMinTSLAFromGuetaStratgeyPosition(
                this.convertAlpacaPositionToPosition(position),
                stopLossPercent
              );
            })
          )
        ).sort((a: { pNl: number }, b: { pNl: number }) => b.pNl - a.pNl)
      : [];
  }

  async getPositionsForStrategy(account: AccountInfo): Promise<Position[]> {
    if (account.strategy === StrategyType.SHEFA) {
      return await (
        await this.alpaca.getPositions()
      ).map(async (position: any) => {
        return await this.getShefaStratgeyPosition(position.symbol);
      });
    } else if (account.strategy === StrategyType.FIFTEEN_MIN_TSLA_FROM_GUETA) {
      return await this.getFifteenMinTSLAFromGuetaStratgeyPositions(
        account.defaultStopLossPercentInTrade
      );
    } else {
      return await this.getPositions();
    }
  }

  async getPositionForStrategy(
    symbol: string,
    account: AccountInfo
  ): Promise<Position> {
    if (account.strategy === StrategyType.SHEFA) {
      return await this.getShefaStratgeyPosition(symbol);
    } else if (account.strategy === StrategyType.FIFTEEN_MIN_TSLA_FROM_GUETA) {
      return await this.getFifteenMinTSLAFromGuetaStratgeyPosition(
        symbol,
        account.defaultStopLossPercentInTrade
      );
    } else {
      return await this.getPosition(symbol);
    }
  }

  async getPosition(symbol: string): Promise<Position> {
    try {
      const position = await this.alpaca.getPosition(symbol);

      return this.convertAlpacaPositionToPosition(position);
    } catch (error: any) {
      if (error === 404) {
        // Position not found
        return null;
      }
      // throw error;
    }
  }

  async getFifteenMinTSLAFromGuetaStratgeyPosition(
    symbol: string,
    stopLossPercent: number
  ) {
    try {
      return await this.addDataToFifteenMinTSLAFromGuetaStratgeyPosition(
        this.convertAlpacaPositionToPosition(
          await this.alpaca.getPosition(symbol)
        ),
        stopLossPercent
      );
    } catch (error) {
      return null;
    }
  }

  async getShefaStratgeyPosition(symbol: string): Promise<Position | null> {
    try {
      const brokerPosition = await this.alpaca.getPosition(symbol);

      const brokerClosedOrders = await this.fetchAllClosedOrders(symbol);
      const lastTwoOrdersWithLegs =
        this.getTwoLastOrdersWithLegs(brokerClosedOrders);

      const tradeType = getTradeTypeFromString(brokerPosition.side);

      const position: any = {
        symbol: symbol,
        type: tradeType,
        qty: Math.abs(brokerPosition.qty),
        entryPrice: parseFloat(brokerPosition.avg_entry_price),
      };

      position.wantedEntryPrice = lastTwoOrdersWithLegs[0].stop_price;
      position.pNl = parseFloat(brokerPosition.unrealized_pl);

      const takeProfit = this.getTakeProfitOrderForShefaStratgey(
        lastTwoOrdersWithLegs,
        tradeType
      );
      position.takeProfits = [takeProfit];
      position.isTakenBaseProfit = takeProfit.isTaken;

      const originalStopLoss = this.getOriginalStopLossForShefaStratgey(
        lastTwoOrdersWithLegs
      );
      position.stopLossesHistory = [originalStopLoss];

      const positionEntryTime = new Date(
        lastTwoOrdersWithLegs[lastTwoOrdersWithLegs.length - 1].filled_at
      );
      position.entryTime = positionEntryTime;
      position.entries = [
        {
          price: parseFloat(brokerPosition.avg_entry_price),
          qty: originalStopLoss.qty,
          date: position,
        },
      ];

      position.stopLosses = await this.getStopLossesForShefaStratgey(
        symbol,
        position.type
      );

      position.exits =
        this.getPositionExitsForShefaStratgey(brokerClosedOrders);

      let exitsPnL = 0;
      position.exits.forEach((exit: OrderPoint) => {
        const pNlInExitPerStock =
          position.type === TradeType.LONG
            ? exit.price - position.entryPrice
            : position.entryPrice - exit.price;
        exitsPnL += pNlInExitPerStock * exit.qty;
      });

      const originalStopLossPerStock =
        position.type === TradeType.LONG
          ? position.entryPrice - originalStopLoss.price
          : originalStopLoss.price - position.entryPrice;

      position.ratio =
        (exitsPnL + position.pNl) / (originalStopLossPerStock * position.qty);
      position.overAllPnL = exitsPnL + position.pNl;

      return position;
    } catch (error: any) {
      if (error === 404) {
        // Position not found
        return null;
      }
      // throw error;
    }
  }

  getTwoLastOrdersWithLegs(orders: any[]): any[] {
    const ordersWithLegs: any[] = [];

    orders.reverse().forEach((order) => {
      if (ordersWithLegs.length < 2 && order.legs) {
        ordersWithLegs.push(order);
      }
    });

    return ordersWithLegs;
  }

  getTakeProfitOrderForShefaStratgey(
    lastTwoOrdersWithLegs: any,
    positionType: TradeType
  ): OrderPoint {
    let takeProfitPrice: number = 0;
    let takeProfitQty: number = 0;
    let isTakenBaseProfit: boolean = false;

    for (let order of lastTwoOrdersWithLegs) {
      order.legs.forEach((leg: any) => {
        if (
          leg.limit_price &&
          (takeProfitPrice === 0 ||
            (positionType === TradeType.LONG
              ? leg.limit_price < takeProfitPrice
              : leg.limit_price > takeProfitPrice))
        ) {
          takeProfitPrice = parseFloat(leg.limit_price);
          takeProfitQty = parseInt(leg.qty);

          if (leg.filled_avg_price) {
            isTakenBaseProfit = true;
          }
        }
      });
    }

    return {
      price: takeProfitPrice,
      qty: takeProfitQty,
      isTaken: isTakenBaseProfit,
      date: lastTwoOrdersWithLegs[0].created_at,
    };
  }

  getOriginalStopLossForShefaStratgey(lastTwoOrdersWithLegs: any): OrderPoint {
    let stopLossPrice: number = 0;
    let stopLossQty: number = 0;
    let isTaken: boolean = false;

    for (let order of lastTwoOrdersWithLegs) {
      order.legs.forEach((leg: any) => {
        if (leg.stop_price) {
          stopLossPrice = parseFloat(leg.stop_price);
          stopLossQty += parseInt(leg.qty);

          if (leg.filled_avg_price) {
            isTaken = true;
          } else {
            isTaken = false;
          }
        }
      });
    }

    return {
      price: stopLossPrice,
      qty: stopLossQty,
      isTaken,
      date: lastTwoOrdersWithLegs[0].created_at,
    };
  }

  async getStopLossesForShefaStratgey(
    symbol: string,
    tradeType: TradeType
  ): Promise<OrderPoint[]> {
    let orders = await this.fetchAllOrders(symbol);
    orders = orders.slice(orders.length - 2, orders.length);

    let isOrdersOriginalStopLosses: boolean = false;

    orders.forEach((order: any) => {
      if (order.legs) {
        isOrdersOriginalStopLosses = true;
      } else {
        isOrdersOriginalStopLosses = false;
      }
    });

    if (isOrdersOriginalStopLosses) {
      let stopLossPrice: number = 0;
      let stopLossQty: number = 0;
      let isStopLossTaken: boolean = false;

      orders.forEach((order) => {
        order.legs.forEach((leg: any) => {
          if (leg.stop_price) {
            stopLossPrice = parseFloat(leg.stop_price);
            stopLossQty += parseInt(leg.qty);

            if (leg.filled_avg_price) {
              isStopLossTaken = true;
            } else {
              isStopLossTaken = false;
            }
          }
        });
      });

      return [
        {
          price: stopLossPrice,
          qty: stopLossQty,
          isTaken: isStopLossTaken,
          date: orders[0].created_at,
        },
      ];
    } else if (
      //is orders created at the same time. there might be a delay in the broker.
      Math.abs(
        new Date(orders[0].created_at).getTime() -
          new Date(orders[1].created_at).getTime()
      ) < 30000
    ) {
      //הפקודות בסדר הנכון
      const ordersInOriginalOrder =
        (orders[0].stop_price > orders[1].stop_price &&
          tradeType === TradeType.LONG) ||
        (orders[0].stop_price < orders[1].stop_price &&
          tradeType === TradeType.SHORT)
          ? [orders[0], orders[1]]
          : [orders[1], orders[0]];

      return ordersInOriginalOrder.map((order) => {
        let isTaken: boolean = false;

        if (order.filled_avg_price) {
          isTaken = true;
        }

        return {
          price: parseFloat(order.stop_price),
          qty: parseInt(order.qty),
          isTaken: isTaken,
          date: order.created_at,
        };
      });
    } else {
      return [
        {
          price: parseFloat(orders[1].stop_price),
          qty: parseInt(orders[1].qty),
          isTaken: false,
          date: orders[1].created_at,
        },
      ];
    }
  }

  getPositionExitsForShefaStratgey(orders: any[]): OrderPoint[] {
    const exits: OrderPoint[] = [];

    orders = [...orders].reverse();
    const lastLegIndex: number = orders.findIndex((order) => order.legs);

    orders.slice(lastLegIndex, lastLegIndex + 2).forEach((order) => {
      if (order.legs) {
        order.legs.forEach((leg: any) => {
          if (leg.filled_avg_price && leg.limit_price) {
            exits.push({
              price: parseFloat(leg.filled_avg_price),
              qty: parseFloat(leg.qty),
              isTaken: true,
              date: new Date(leg.filled_at),
            });
          }
        });
      }
    });

    orders.slice(0, lastLegIndex).forEach((order) => {
      if (order.filled_avg_price) {
        exits.push({
          price: parseFloat(order.filled_avg_price),
          qty: parseFloat(order.qty),
          isTaken: true,
          date: new Date(order.filled_at),
        });
      }
    });

    return exits;
  }

  async getPositionPnL(symbol: string): Promise<number> {
    try {
      return parseFloat((await this.alpaca.getPosition(symbol)).unrealized_pl);
    } catch (error) {
      if (error === 404) {
        // Position not found
        return null;
      }
    }
  }

  async isInPosition(symbol: string): Promise<boolean> {
    const positions: any[] = await this.alpaca.getPositions();
    return positions.some((position) => position.symbol === symbol);
  }

  async getAccountValuesHistory(): Promise<{ value: number; date: Date }[]> {
    const accountValuesHistory: { value: number; date: Date }[] = [];

    const portfolioHistory = await this.alpaca.getPortfolioHistory({
      period: "5A",
      timeframe: "1D",
      date_start: "",
      date_end: "",
      extended_hours: "",
    });

    portfolioHistory.equity.forEach((value: number, index: number) => {
      if (value !== 0) {
        accountValuesHistory.push({
          value: value,
          date: new Date(portfolioHistory.timestamp[index] * 1000),
        });
      }
    });

    return accountValuesHistory;
  }

  async getClosedTrades(account: AccountInfo) {
    const orders = this.sortOrdersBySymbol(await this.fetchAllClosedOrders());

    try {
      return this.createTradesFromOrders(orders, account).sort(
        (a, b) => b.entryTime.getTime() - a.entryTime.getTime()
      );
    } catch (error) {
      console.log(error);
    }
  }

  async fetchAllClosedOrders(
    symbol?: string,
    startDateInMilliseconds?: number
  ) {
    const twoYearsInMilliseconds = 63113904000;
    startDateInMilliseconds = startDateInMilliseconds
      ? Math.max(
          startDateInMilliseconds,
          new Date(new Date().getTime() - twoYearsInMilliseconds).getTime()
        )
      : null;
    const thirtyDaysInMilliseconds: number = 2592000000;
    let allOrders: any[] = [];

    let orders = [];
    let index = 1;
    let after = new Date(
      new Date().getTime() - thirtyDaysInMilliseconds * index
    );
    let until = new Date(
      new Date().getTime() - thirtyDaysInMilliseconds * (index - 1)
    );

    while (
      (orders.length !== 0 || index == 1) &&
      (startDateInMilliseconds
        ? until.getTime() >= startDateInMilliseconds
        : true)
    ) {
      orders = await this.alpaca.getOrders({
        status: "closed",
        limit: 500, //the limit of the api,
        after: after.toISOString(),
        until: until.toISOString(),
        direction: "desc",
        nested: "true",
        symbols: symbol !== undefined ? symbol : "",
      });

      allOrders = allOrders.concat(orders);
      index++;

      after = new Date(new Date().getTime() - thirtyDaysInMilliseconds * index);
      until = new Date(
        new Date().getTime() - thirtyDaysInMilliseconds * (index - 1)
      );
    }

    return allOrders
      .filter(
        (order) => parseInt(order.filled_qty) > 0 || order.status !== "canceled"
      )
      .reverse();
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

  createTradesFromOrders(orders: any[], account: AccountInfo) {
    let ordersWithLegsOut: any[] = [];
    orders.forEach((order) => {
      ordersWithLegsOut.push(order);

      if (order.legs) {
        order.legs.forEach(
          (leg: {
            filled_avg_price: string;
            qty: string;
            filled_at: string | number | Date;
            side: any;
          }) => {
            if (leg.filled_avg_price) {
              ordersWithLegsOut.push(leg);
            }
          }
        );
      }
    });

    ordersWithLegsOut = ordersWithLegsOut.sort(
      (a, b) =>
        new Date(a.filled_at).getTime() - new Date(b.filled_at).getTime()
    );

    const closedTrades: Trade[] = [];

    let symbol: string = "";
    let entries: any[] = [];
    let exits: any[] = [];
    let entryQty: number = 0;
    let exitQty: number = 0;
    let tradeType: TradeType = null;
    let originalStopLossPrice: number = null;

    ordersWithLegsOut.forEach((order) => {
      if (order.legs) {
        order.legs.forEach((leg: any) => {
          if (leg.stop_price) {
            originalStopLossPrice = parseFloat(leg.stop_price);
          }
        });
      }

      const qty: number = parseInt(order.filled_qty);

      if (entryQty === 0 || symbol != order.symbol) {
        symbol = order.symbol;
        entries = [
          {
            price: parseFloat(order.filled_avg_price),
            qty: qty,
            date: order.filled_at,
          },
        ];
        exits = [];
        entryQty = qty;
        exitQty = 0;
        tradeType = convertBuyOrSellStringToTradeType(order.side);
        originalStopLossPrice = null;
      } else {
        if (convertBuyOrSellStringToTradeType(order.side) === tradeType) {
          entries.push({
            price: parseFloat(order.filled_avg_price),
            qty: qty,
            date: order.filled_at,
          });
          entryQty += qty;
        } else {
          exits.push({
            price: parseFloat(order.filled_avg_price),
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
                tradeType,
                account?.strategy === StrategyType.FIFTEEN_MIN_TSLA_FROM_GUETA
                  ? entries[0].price -
                      (account.defaultStopLossPercentInTrade / 100) *
                        entries[0].price
                  : originalStopLossPrice,
                account
              )
            );

            symbol = "";
            entries = [];
            exits = [];
            entryQty = 0;
            exitQty = 0;
            tradeType = null;
            originalStopLossPrice = null;
          }
        }
      }
    });

    return closedTrades;
  }

  async getAllOrdersSymbols(): Promise<string[]> {
    return uniq(
      (await this.fetchAllClosedOrders()).map((order) => order.symbol)
    );
  }

  async getOrdersBySymbol(
    symbol: string,
    startDateInMilliseconds?: number
  ): Promise<
    {
      price: number;
      qty: number;
      date: Date;
      type: "buy" | "sell";
    }[]
  > {
    const orders:
      | PromiseLike<
          { price: number; qty: number; date: Date; type: "buy" | "sell" }[]
        >
      | { price: number; qty: number; date: Date; type: any }[] = [];
    const brokerOrders = await this.fetchAllClosedOrders(
      symbol,
      startDateInMilliseconds
    );

    brokerOrders.forEach((order) => {
      orders.push({
        price: parseFloat(order.filled_avg_price),
        qty: parseFloat(order.qty),
        date: new Date(order.filled_at),
        type: order.side,
      });

      if (order.legs) {
        order.legs.forEach(
          (leg: {
            filled_avg_price: string;
            qty: string;
            filled_at: string | number | Date;
            side: any;
          }) => {
            if (leg.filled_avg_price) {
              orders.push({
                price: parseFloat(leg.filled_avg_price),
                qty: parseFloat(leg.qty),
                date: new Date(leg.filled_at),
                type: leg.side,
              });
            }
          }
        );
      }
    });

    return orders;
  }

  async convertAlpacaBarsToBars(bars: AlpacaBar[]): Promise<Bar[]> {
    return bars.map((bar) => ({
      openPrice: bar.OpenPrice,
      closePrice: bar.ClosePrice,
      highPrice: bar.HighPrice,
      lowPrice: bar.LowPrice,
      time: this.convertApiDateFormatToJSDate(bar.Timestamp),
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

  public convertApiDateFormatToJSDate(dateString: string): Date {
    const dateInNewYork = moment.tz(
      dateString,
      "DD/MM/YYYY, HH:mm:ss",
      "America/New_York"
    );

    const utcString = dateInNewYork.utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";

    return new Date(utcString);
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

  getTimeFrameFromString(str: string): TimeFrameUnit {
    if (str === "Day") {
      return TimeFrameUnit.DAY;
    } else if (str === "Hour") {
      return TimeFrameUnit.HOUR;
    } else if (str === "Min") {
      return TimeFrameUnit.MIN;
    } else if (str === "Month") {
      return TimeFrameUnit.MONTH;
    } else if (str === "Week") {
      return TimeFrameUnit.WEEK;
    }
  }

  convertAlpacaPositionToPosition(alpacaPosition: any): Position {
    const tradeType: TradeType = getTradeTypeFromString(alpacaPosition.side);

    return {
      id: undefined,
      symbol: alpacaPosition.symbol,
      type: tradeType,
      qty: parseInt(alpacaPosition.qty),
      entryPrice: parseFloat(alpacaPosition.avg_entry_price),
      entryTime: undefined,
      pNl: parseFloat(alpacaPosition.unrealized_pl),
      percentPnL: calclautePercentagePnL(
        alpacaPosition.avg_entry_price,
        alpacaPosition.current_price,
        tradeType
      ),
      dailyPnl: parseFloat(alpacaPosition.unrealized_intraday_pl),
      currentStockPrice: parseFloat(alpacaPosition.current_price),
      netLiquidation: Math.abs(
        alpacaPosition.current_price * alpacaPosition.qty
      ),
      overAllPnL: parseFloat(alpacaPosition.unrealized_pl),
    };
  }

  async addDataToFifteenMinTSLAFromGuetaStratgeyPosition(
    position: Position,
    stopLossPercent: number
  ): Promise<Position> {
    const stopLossPrice =
      position.entryPrice - (stopLossPercent / 100) * position.entryPrice;
    position.stopLosses = [
      {
        price: stopLossPrice,
        qty: position.qty,
      },
    ];
    position.stopLossesHistory = [...position.stopLosses];

    position.ratio =
      position.pNl / ((position.entryPrice - stopLossPrice) * position.qty);

    position.entryTime = new Date(
      (await this.getLastOrder(position.symbol)).filled_at
    );

    return position;
  }
}

export default AlpacaBrokerAPI;
