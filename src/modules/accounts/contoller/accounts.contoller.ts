import { Accounts } from "@src/BrokerAPI/Accounts";
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
}
export default new AccountsController();
