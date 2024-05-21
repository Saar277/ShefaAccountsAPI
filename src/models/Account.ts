import { AccountSituation } from "./AccountSituation";
import { Position } from "./Position";
import Statistics from "./Statistics";
import { Trade } from "./Trade";

export interface Account {
    name: string;
    cash: number;
    statistics: Statistics;
    positions: Position[];
    closedTrades: Trade[];
    accountSituations: AccountSituation[];
}