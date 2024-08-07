import { Accounts } from "../../../BrokerAPI/Accounts";
import { Request, Response } from "express";

/**
 * This class responsible to accept request and send respones.
 */
class AccountsController {
  /**
   * get all the examples Dtos and return them
   * @param req - the request from the world
   * @param res - the response we return
   */

  getAccountsPositions = async (req: Request, res: Response) => {
    try {
      res.status(200).send(await Accounts.getAccountsPositions());
    } catch {
      res.status(500).send();
    }
  };

  getAccountPositions = async (req: Request, res: Response) => {
    try {
      res
        .status(200)
        .send(await Accounts.getAccountPositions(req.params.accountName));
    } catch {
      res.status(500).send();
    }
  };

  getAccountsValuesHistory = async (req: Request, res: Response) => {
    try {
      res.status(200).send(await Accounts.getAccountsValuesHistory());
    } catch {
      res.status(500).send();
    }
  };

  getAccountValuesHistory = async (req: Request, res: Response) => {
    try {
      res
        .status(200)
        .send(await Accounts.getAccountValuesHistory(req.params.accountName));
    } catch {
      res.status(500).send();
    }
  };

  getAccountValuesHistoryInDates = async (req: Request, res: Response) => {
    try {
      res
        .status(200)
        .send(
          await Accounts.getAccountValuesHistoryInDatesRange(
            req.params.accountName,
            parseInt(req.params.startDate),
            parseInt(req.params.endDate)
          )
        );
    } catch {
      res.status(500).send();
    }
  };

  getAccountPnlInEveryMonthOrYearOrDay = async (
    req: Request,
    res: Response
  ) => {
    try {
      res
        .status(200)
        .send(
          await Accounts.getAccountPnlInEveryMonthOrYearOrDay(
            req.params.accountName,
            req.params.monthOrYearOrDay
          )
        );
    } catch {
      res.status(500).send();
    }
  };

  getAccountsTrades = async (req: Request, res: Response) => {
    try {
      res.status(200).send(await Accounts.getClosedTrades());
    } catch {
      res.status(500).send();
    }
  };

  getAccountTrades = async (req: Request, res: Response) => {
    try {
      res
        .status(200)
        .send(await Accounts.getClosedTradesForAccount(req.params.accountName));
    } catch {
      res.status(500).send();
    }
  };

  getAccountsStatistics = async (req: Request, res: Response) => {
    try {
      res.status(200).send(await Accounts.getAccountsTradesStatistics());
    } catch {
      res.status(500).send();
    }
  };

  getAccountStatistics = async (req: Request, res: Response) => {
    try {
      res
        .status(200)
        .send(
          await Accounts.getAccountTradesStatistics(req.params.accountName)
        );
    } catch {
      res.status(500).send();
    }
  };

  getAccountStatisticsForSymbol = async (req: Request, res: Response) => {
    try {
      res
        .status(200)
        .send(
          await Accounts.getAccountTradesStatisticsForSymbol(
            req.params.accountName,
            req.params.symbol
          )
        );
    } catch {
      res.status(500).send();
    }
  };

  getAccountStatisticsPerSymbol = async (req: Request, res: Response) => {
    try {
      res
        .status(200)
        .send(
          await Accounts.getAccountTradesStatisticsPerSymbol(
            req.params.accountName
          )
        );
    } catch {
      res.status(500).send();
    }
  };

  getAccountStatisticsInTimeRange = async (req: Request, res: Response) => {
    try {
      res
        .status(200)
        .send(
          await Accounts.getAccountTradesStatisticsInTimeRange(
            req.params.accountName,
            parseInt(req.params.startDate),
            parseInt(req.params.endDate)
          )
        );
    } catch {
      res.status(500).send();
    }
  };

  getAccountsOrdersSymbols = async (req: Request, res: Response) => {
    try {
      res.status(200).send(await Accounts.getAccountsOrdersSymbols());
    } catch {
      res.status(500).send();
    }
  };

  getAccountOrdersSymbols = async (req: Request, res: Response) => {
    try {
      res
        .status(200)
        .send(await Accounts.getAccountOrdersSymbols(req.params.accountName));
    } catch {
      res.status(500).send();
    }
  };

  getAccountsNames = (req: Request, res: Response) => {
    try {
      res.status(200).send(Accounts.getAccountsNames());
    } catch {
      res.status(500).send();
    }
  };

  getBarsWithOrdersAndStopLossesAndTakeProfits = async (
    req: Request,
    res: Response
  ) => {
    try {
      res
        .status(200)
        .send(
          await Accounts.getBarsWithOrdersAndStopLossesAndTakeProfits(
            req.params.accountName,
            req.params.symbol,
            parseInt(req.params.timeFrame),
            req.params.TimeFrameUnit
          )
        );
    } catch {
      res.status(500).send();
    }
  };

  getBarsWithOrdersWithSmaAndStopLossesAndTakeProfits = async (
    req: Request,
    res: Response
  ) => {
    try {
      res
        .status(200)
        .send(
          await Accounts.getBarsWithOrdersWithSmaAndStopLossesAndTakeProfits(
            req.params.accountName,
            req.params.symbol,
            parseInt(req.params.timeFrame),
            req.params.TimeFrameUnit,
            parseInt(req.params.smaLength),
            parseFloat(req.params.startMilliseconds)
          )
        );
    } catch {
      res.status(500).send();
    }
  };

  getBarsWithOrdersAndMinMaxPointsAndStopLossesAndTakeProfits = async (
    req: Request,
    res: Response
  ) => {
    try {
      res
        .status(200)
        .send(
          await Accounts.getBarsWithOrdersAndMinMaxPointsAndStopLossesAndTakeProfits(
            req.params.accountName,
            req.params.symbol,
            parseInt(req.params.timeFrame),
            req.params.TimeFrameUnit,
            parseInt(req.params.rollingWindow),
            parseFloat(req.params.startMilliseconds)
          )
        );
    } catch {
      res.status(500).send();
    }
  };

  getAllOrders = async (req: Request, res: Response) => {
    try {
      res.status(200).send(await Accounts.getAllOrders());
    } catch {
      res.status(500).send();
    }
  };

  getAccountAllOrders = async (req: Request, res: Response) => {
    try {
      res
        .status(200)
        .send(await Accounts.getAccountAllOrders(req.params.accountName));
    } catch {
      res.status(500).send();
    }
  };

  getAccountAllOpenOrders = async (req: Request, res: Response) => {
    try {
      res
        .status(200)
        .send(await Accounts.getAccountAllOpenOrders(req.params.accountName));
    } catch {
      res.status(500).send();
    }
  };
}

export default new AccountsController();
