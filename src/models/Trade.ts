import { Position } from "./Position";

export interface Trade extends Position {
  closePrice: number;
  closeTime: Date;
  entries: { price: number; qty: number; date: Date }[];
  exits: { price: number; qty: number; date: Date }[];
}
