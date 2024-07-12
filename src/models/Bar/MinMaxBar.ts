import Bar from "./Bar";

export enum MinMaxType {
  MAXIMA = "MAXIMA",
  MINIMA = "MINIMA"
}

export interface MinMaxBar extends Bar {
  type: MinMaxType;
  pricePoint: number;
};
