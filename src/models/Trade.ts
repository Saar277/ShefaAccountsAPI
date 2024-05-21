import { Position } from "./Position";

export interface Trade extends Position {
    closePrice: number;
    closeTime: Date;
}