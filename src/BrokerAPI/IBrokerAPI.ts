import { AccountInfo } from "../models/AccountInfo";
import Bar from "../models/Bar/Bar";
import { Position } from "../models/Position";

interface IBrokerAPI {
  connect(): void;
  disconnect(): Promise<any>;
  getAccount(): Promise<any>;
  getClock(): Promise<any>;
  getBars(
    symbol: string,
    timeFrame: number,
    timeFrameUnit: any,
    onlyMarketHours: boolean,
    startDate: string,
    endDate?: string
  ): Promise<Bar[]>; // Adjust the return type as needed
  createMarketOrder(
    symbol: string,
    qty: number,
    side: "buy" | "sell"
  ): Promise<any>;
  createLimitOrder(
    symbol: string,
    qty: number,
    side: "buy" | "sell",
    limitPrice: number
  ): Promise<any>;
  createStopOrder(
    symbol: string,
    qty: number,
    side: "buy" | "sell",
    stopPrice: number
  ): Promise<any>;
  createStopLimitOrder(
    symbol: string,
    qty: number,
    side: "buy" | "sell",
    limitPrice: number,
    stopPrice: number
  ): Promise<any>;
  createTrailingStopOrder(
    symbol: string,
    qty: number,
    side: "buy" | "sell",
    trailPrice: number,
    trailPercent: number
  ): Promise<any>;
  createTakeProfitOrder(
    symbol: string,
    qty: number,
    side: "buy" | "sell",
    limitPrice: number
  ): Promise<any>;
  getOpenOrders(symbol?: string): Promise<any[]>;
  getCash(): Promise<number>;
  getMoneyAmount(): Promise<number>;
  getPositions(): Promise<Position[]>;
  getPositionsForStrategy(account: AccountInfo): Promise<Position[]>;
  getPosition(symbol: string): Promise<any | null>;
  getPositionForStrategy(
    symbol: string,
    account: AccountInfo
  ): Promise<Position>;
  isInPosition(symbol: string): Promise<boolean>;
  getAccountValuesHistory(): Promise<{ value: number; date: Date }[]>;
  getClosedTrades(account: AccountInfo): any;
  getDateInApiFormat(date: Date): string;
  isClockOpen(): Promise<boolean>;
  closePosition(symbol: string): void;
  getAllOrdersSymbols(): Promise<string[]>;
  getOrdersBySymbol(symbol: string, startDateInMilliseconds?: number): any;
}

export default IBrokerAPI;
