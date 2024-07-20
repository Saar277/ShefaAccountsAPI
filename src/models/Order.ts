export interface Order {
  price: number;
  filledPrice?: number;
  qty: number;
  filledQty?: number;
  side: "buy" | "sell";
  date: Date;
  filledDate?: Date;
  status: "open" | "closed" | "canceled" | "filled";
  takeProfits?: Order[];
  stopLosses?: Order[];
}
