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
import { Order } from "../models/Order";

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

    return allOrders.reverse();
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
      return await Promise.all(
        await (
          await this.alpaca.getPositions()
        ).map(async (position: any) => {
          return await this.getShefaStratgeyPosition(position.symbol);
        })
      );
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

      position.wantedEntryPrice = parseFloat(
        lastTwoOrdersWithLegs[0].stop_price
      );
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
          date: positionEntryTime,
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
    let orders = (await this.fetchAllOrders(symbol)).filter(
      (order: any) => order.status !== "canceled"
    );
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

  async getClosedOrdersBySymbol(
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

  async getAllOrders(symbol?: string): Promise<Order[]> {
    const brokerOrders = await this.fetchAllOrders(symbol);
    const formattedOrders: Order[] = [];

    brokerOrders.forEach((order) => {
      const formattedOrder: Order = this.convertAlpacaOrderToOrder(order);

      if (order.legs) {
        order.legs.forEach((leg: any) => {
          const formattedLeg = this.convertAlpacaOrderToOrder(leg);

          if (leg.stop_price) {
            formattedOrder.stopLosses = [formattedLeg];
          } else if (leg.limit_price) {
            formattedOrder.takeProfits = [formattedLeg];
          }
        });
      }

      formattedOrders.push(formattedOrder);
    });

    return formattedOrders;
  }

  convertAlpacaOrderToOrder(alpacaOrder: any): Order {
    const formattedOrder: Order = {
      price:
        parseFloat(alpacaOrder.stop_price) ||
        parseFloat(alpacaOrder.limit_price) ||
        parseFloat(alpacaOrder.filled_avg_price),
      qty: parseInt(alpacaOrder.qty),
      side: alpacaOrder.side,
      date: new Date(alpacaOrder.created_at),
      status: this.convertAlpacaOrderSideToSide(alpacaOrder.status),
    };

    if (alpacaOrder.filled_avg_price) {
      formattedOrder.filledPrice = parseFloat(alpacaOrder.filled_avg_price);
      formattedOrder.filledQty = parseInt(alpacaOrder.filled_qty);
      formattedOrder.filledDate = new Date(alpacaOrder.filled_at);
    }

    return formattedOrder;
  }

  convertAlpacaOrderSideToSide(alpacaOrderSide: string) {
    if (alpacaOrderSide === "new" || alpacaOrderSide === "accepted") {
      return "open";
    } else if (alpacaOrderSide === "filled" || alpacaOrderSide === "closed") {
      return "filled";
    } else if (alpacaOrderSide === "canceled") {
      return alpacaOrderSide;
    }
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
    let currDate = "";
    let currAlpacaOpen = "";
    let currAlpacaClose = "";
    const filteredBars = [];

    for (let bar of bars) {
      const barYear = bar.Timestamp.substring(6, 10);
      const barDay = bar.Timestamp.substring(0, 2);
      const barMonth = bar.Timestamp.substring(3, 5);
      const barDateInAlpacaFormat = `${barYear}-${barMonth}-${barDay}T00:00:00Z`;

      if (currDate !== barDateInAlpacaFormat) {
        currDate = barDateInAlpacaFormat;

        const alpacaCalender = await this.alpaca.getCalendar({
          start: currDate,
          end: currDate,
        });

        if (alpacaCalender.length !== 0) {
          currAlpacaOpen = alpacaCalender[0].open;
          currAlpacaClose = alpacaCalender[0].close;
        } else {
          currAlpacaOpen = null;
          currAlpacaClose = null;
        }
      }

      if (
        currAlpacaOpen !== null &&
        currAlpacaClose !== null &&
        this.isTimeBetween(
          +currAlpacaOpen.substring(0, 2), //startHour
          +currAlpacaOpen.substring(3, 5), //startMin
          +currAlpacaClose.substring(0, 2), //endHour
          -timeframe + +currAlpacaClose.substring(3, 5), //endMin
          +bar.Timestamp.substring(12).substring(0, 2), //barHour
          +bar.Timestamp.substring(12).substring(3, 5) //barMin
        )
      ) {
        filteredBars.push(bar);
      }
    }

    return filteredBars;
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
