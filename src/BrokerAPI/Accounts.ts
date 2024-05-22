import AlpacaBrokerAPI from "./AlpacaBrokerAPI";
import IBrokerAPI from "./IBrokerAPI";
import { accountsInfo } from "../env";
import { Position } from "@src/models/Position";

export class Accounts {
  private static accounts: { iBrokerAPI: IBrokerAPI; name: string }[] =
    this.intalizeAccounts();

  public static getAccounts() {
    return this.accounts;
  }

  public static intalizeAccounts(): { iBrokerAPI: IBrokerAPI; name: string }[] {
    return accountsInfo.map((accountInfo) => {
      return {
        iBrokerAPI: new AlpacaBrokerAPI(
          accountInfo.API_KEY,
          accountInfo.API_SECRET
        ),
        name: accountInfo.NAME,
      };
    });
  }

  public static async getAccountsPositions(): Promise<
    { accountName: string; positions: Position[] }[]
  > {
    return await Promise.all(
      this.accounts.map(async (account) => {
        return {
          accountName: account.name,
          positions: await account.iBrokerAPI.getPositions(),
        };
      })
    );
  }

  public static async getAccountValuesHistory(): Promise<
    {
      accountName: string;
      accountValuesHistory: {
        value: number;
        date: Date;
      }[];
    }[]
  > {
    return await Promise.all(
      this.accounts.map(async (account) => {
        return {
          accountName: account.name,
          accountValuesHistory:
            await account.iBrokerAPI.getAccountValuesHistory(),
        };
      })
    );
  }

  public static async getClosedTrades() {
    return this.accounts.map(async (account) => {
      return await account.iBrokerAPI.getClosedTrades();
    })
  }
}
