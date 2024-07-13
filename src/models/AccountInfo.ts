import { StrategyType } from "../models/strategiesTypes";
import IBrokerAPI from "../BrokerAPI/IBrokerAPI";

export interface AccountInfo {
  iBrokerAPI: IBrokerAPI;
  name: string;
  strategy?: StrategyType;
  defaultStopLossPercentInTrade?: number;
}
