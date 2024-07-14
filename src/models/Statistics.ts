export default interface Statistics {
  startMoneyAmount: number;
  moneyAmount: number;
  pNl: number;
  percentPNl: number;
  realizedPnL?: number;
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
  startDate: Date;
}
