import { Request, Response } from "express";
import { TroopsDto } from "../Dto/troops.location.dto";
import { TroopsDtoAll } from "../Dto/troops.dto";
import { TypesDto } from "../Dto/types.amount.dto";
import getTroopses from "../logic/getRootses";

/**
 * This class responsible to accept request and send respones.
 */
class TroopsController {
  /**
   * get all the examples Dtos and return them
   * @param req - the request from the world
   * @param res - the response we return
   */
  getAllTroops = async (req: Request, res: Response) => {
    try {
      const troopsesDto: TroopsDto[] = await getTroopses.getAllTroopses();
      res.status(200).send(troopsesDto);
    } catch {
      res.status(500).send();
    }
  };

    getTroopsById = async (req: Request, res: Response) => {
        try{
            const troopsDto: TroopsDtoAll = await getTroopses.getTroopsById(req.params.id);
            res.status(200).send(troopsDto);
        }
        catch{
            res.status(400).send();
        }
    }

    getAmountsByType = async (req: Request, res: Response) => {
        try{
            const amounts: TypesDto[] = await getTroopses.getAmountsByType();
            res.status(200).send(amounts);
        }
        catch{
            res.status(400).send();
        }
    }

}
export default new TroopsController();
