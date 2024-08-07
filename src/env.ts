import { StrategyType } from "./models/strategiesTypes";

export const accountsInfo = [
  {
    NAME: "saar",
    API_KEY: "PKR3C3OPHLH0NHOZOLYV",
    API_SECRET: "ausNDE86OQghMVxFbib6295lbQGaNweFruaK6x54",
  },
  {
    NAME: "b&s-15Min-TSLA",
    API_KEY: "PK54EOYASV42P29EL8AD",
    API_SECRET: "Wgn7e0mYrbGnDUBNw25u7Cfmt7VwFwXcFQpiGdcc",
    STRATEGY: StrategyType.FIFTEEN_MIN_TSLA_FROM_GUETA,
    DEFAULT_STOP_LOSS_PERCENT_IN_TRADE: 2.5
  },
  {
    NAME: "b&s-15Min-TSLA-bestPnLCombination",
    API_KEY: "PKY1WHBB4ZZ3401KX0LE",
    API_SECRET: "A7RZVsMbHhc1nfnKo7U8oIpecyBmoIQ96aDj3a4n",
    STRATEGY: StrategyType.FIFTEEN_MIN_TSLA_FROM_GUETA,
    DEFAULT_STOP_LOSS_PERCENT_IN_TRADE: 1.5
  },
  {
    NAME: "b&s-15Min-AAPL",
    API_KEY: "PK46VO5KPVMZHFJ4D2DG",
    API_SECRET: "XAbm6XRyVFkf6FZ6cthgsNoqkt2owluv9D3i9TvE",
    STRATEGY: StrategyType.FIFTEEN_MIN_TSLA_FROM_GUETA,
    DEFAULT_STOP_LOSS_PERCENT_IN_TRADE: 2.5
  },
  {
    NAME: "b&s-15Min-QQQ",
    API_KEY: "PKP5FN5OED69X6Y58EBY",
    API_SECRET: "bx0Kvz6R6glth1FBk62Iw6tAqDcFZmrx6SoxecJl",
    STRATEGY: StrategyType.FIFTEEN_MIN_TSLA_FROM_GUETA,
    DEFAULT_STOP_LOSS_PERCENT_IN_TRADE: 2.5
  },
  {
    NAME: "test",
    API_KEY: "PKTQDYD6Z4DKI62QYBWM",
    API_SECRET: "5QzrjtZsdcMB1IXpsAJVs5rhMlCdZMueQHshup36",
    STRATEGY: StrategyType.SHEFA,
  },
];
