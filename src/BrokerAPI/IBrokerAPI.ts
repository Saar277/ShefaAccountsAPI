import { Order } from "../models/Order";
import { AccountInfo } from "../models/AccountInfo";
import Bar from "../models/Bar/Bar";
import { Position } from "../models/Position";

interface IBrokerAPI {
  connect(): void;
  getBars(
    symbol: string,
    timeFrame: number,
    timeFrameUnit: any,
    onlyMarketHours: boolean,
    startDate: string,
    endDate?: string
  ): Promise<Bar[]>; // Adjust the return type as needed
  getMoneyAmount(): Promise<number>;
  getPositions(): Promise<Position[]>;
  getPositionsForStrategy(account: AccountInfo): Promise<Position[]>;
  getPosition(symbol: string): Promise<any | null>;
  getPositionForStrategy(
    symbol: string,
    account: AccountInfo
  ): Promise<Position>;
  getPositionPnL(symbol: string): Promise<number>;
  getAccountValuesHistory(): Promise<{ value: number; date: Date }[]>;
  getClosedTrades(account: AccountInfo): any;
  getDateInApiFormat(date: Date): string;
  getAllOrdersSymbols(): Promise<string[]>;
  getClosedOrdersBySymbol(
    symbol: string,
    startDateInMilliseconds?: number
  ): any;
  getAllOrders(symbol?: string): Promise<Order[]>;
}

export default IBrokerAPI;
