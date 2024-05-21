import { TradeType } from "./TradeType";

export interface Position {
    id: string;
    symbol: string;
    type: TradeType;
    qty: number;
    entryPrice: number;
    entryTime: Date;
    pNl: number;
    dailyPnl: number;
    stopLosses?: { price: number; qty: number, isTaken?: boolean }[];
    takeProfits?: { price: number; qty: number }[];
    isTakenBaseProfit?: boolean;
    stopLossesHistory?: { price: number; qty: number }[];
}