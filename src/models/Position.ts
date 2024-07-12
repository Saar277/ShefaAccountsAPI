import OrderPoint from "./orderPoint";
import { TradeType } from "./TradeType";

export interface Position {
  id: string;
  symbol: string;
  type: TradeType;
  qty: number;
  entryPrice: number;
  entryTime: Date;
  pNl: number;
  percentPnL: number;
  dailyPnl: number;
  currentStockPrice: number;
  netLiquidation: number;
  stopLosses?: OrderPoint[];
  takeProfits?: OrderPoint[];
  isTakenBaseProfit?: boolean;
  stopLossesHistory?: OrderPoint[];
  entries?: OrderPoint[];
  exits?: OrderPoint[];
  wantedEntryPrice?: number;
  ratio?: number;
}
