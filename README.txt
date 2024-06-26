QUERIES:

get accounts positions:
route: /accounts/positions
return: { accountName: string; positions: Position[] }[]

get accounts values history:
route: /accounts/values
return: 
{
  accountName: string;
  accountValuesHistory: {
    value: number;
    date: Date;
  }[];
}[]

get account values history by accountName:
route: /values/:accountName
return: 
{
  accountName: string;
  accountValuesHistory: {
    value: number;
    date: Date;
  }[];
}

get get Account Values History In DatesRange:
route: /values/:accountName/:startDate/:endDate
the startDate and endDate needs to be in milliseconds.
return {
  value: number,
  date: Date
}[]

get AccountPnl In Every Month Or Year:
route: /pNl/:accountName/:monthOrYear
in monthOrYear you need to write month or year
return {
  date: Date,
  pNl: number
}[]

get accounts closed trades:
route: /accounts/trades
return:
{
  accountName: string;
  trades: {
    symbol: string,
    type: TradeType,
    qty: number,
    entryPrice: number,
    entryTime: string (repesents Date)
    pNl: number,
    percentPnL: number,
    closePrice: number,
    closeTime: string (repesents Date),
    entries: {price: number; qty: number; date: string (repesents Date)}[],
    exits: {price: number; qty: number; date: string (repesents Date)}[]
  }[]
}

get account closed trades by accountName:
route: /accounts/trades/:accountName
return:
trades: {
    symbol: string,
    type: TradeType,
    qty: number,
    entryPrice: number,
    entryTime: string (repesents Date)
    pNl: number,
    percentPnL: number,
    closePrice: number,
    closeTime: string (repesents Date),
    entries: {price: number; qty: number; date: string (repesents Date)}[],
    exits: {price: number; qty: number; date: string (repesents Date)}[]
  }[]

get account statistics:
route: /accounts/statistics/:accountName #(in accountName write the name of the account you want)
return: Statistics

get account statistics in time range:
route: /accounts/statistics/:accountName/:startDate/:endDate
# in accountName write the name of the account you want
# startDate and endDate needs to be milliseconds
return: Statistics

get accounts orders symbols: #the symbols every account did orders in
route: /accounts/symbols
return: 
{
  accountName: string;
  symbols: string[];
}[]

get account orders symbols: #the symbols the account did orders in
route: /accounts/symbols/:accountName
return: string[];

get accounts names:
route: /accounts/names
return: string[]

get stock bars and orders for specific account:
this query get: account name, symbol, timeFrame (every number) and timeFrameUnit (Day, Hour, Min, Month, Week)
route: /accounts/bars/:accountName/:symbol/:timeFrame/:TimeFrameUnit
return:
{
  orders: {
    price: number,
    qty: number,
    date: Date,
    type: string (buy or sell)
  }[];
  bars: {
    openPrice: number,
    closePrice: number,
    highPrice: number,
    lowPrice: number,
    time: Date
  }[];
}

get stock bars and orders and sma values for specific account:
this query get: account name, symbol, timeFrame (every number), timeFrameUnit (Day, Hour, Min, Month, Week) and sma length
route: /accounts/bars/:accountName/:symbol/:timeFrame/:TimeFrameUnit/:smaLength
return:
{
  orders: {
    price: number,
    qty: number,
    date: Date,
    type: string (buy or sell)
  }[];
  bars: {
    openPrice: number,
    closePrice: number,
    highPrice: number,
    lowPrice: number,
    time: Date
  }[];
  smaValues: {
    date: Date,
    value: number
  }[];
}

MODELS: #(maybe this model changed. it is better to see the models in /src/models)

Position {
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
  stopLosses?: { price: number; qty: number; isTaken?: boolean }[];
  takeProfits?: { price: number; qty: number }[];
  isTakenBaseProfit?: boolean;
  stopLossesHistory?: { price: number; qty: number }[];
}

TradeType {
  LONG = "LONG",
  SHORT = "SHORT",
}

Statistics {
  startMoneyAmount: number;
  moneyAmount: number;
  pNl: number;
  percentPNl: number;
  winningTradesCount: number;
  losingTradesCount: number;
  successRate: number;
  avgWinningTrade: number;
  avgLosingTrade: number;
  ratio: number;
  largestWinningTrade: number;
  largestLosingTrade: number;
  longPrecentage: number;
  shortPrecentage: number;
}