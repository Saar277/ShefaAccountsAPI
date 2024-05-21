import { Repository } from "typeorm";
import { AppDataSource } from "../../../data-source";
import { Troops } from "../models/troops.model";

// get the Repoistory of the Entity 
const troopsRepository: Repository<Troops> = AppDataSource.getRepository(Troops);

/**
 * This class is responsible to access the DB.
 */
class TroopsService {
    
    /**
     * get all the examples from db
     * @returns - all the exmaples entities from the db
     */
    getTroops = async (): Promise<Troops[]> => {
        try {
           const data: Troops[] = await troopsRepository.find();
           return data;
        }
        catch (e) {
            console.log(e);
        }
    }

    getTroopsById = async (id: number): Promise<Troops> => {
        try {
           const data: Troops = await troopsRepository.findOne({
            where: {
                id: id
            },
           });
           return data;
        }
        catch (e) {
            console.log(e);
        }
    }

    getAmountByType = async (): Promise<any[]> => {
        try {
            const amounts: any[]= await troopsRepository.createQueryBuilder("troops").
            select("troops.type", "type")
            .addSelect("SUM(troops.amount)", "amount")
            .groupBy("troops.type")
            .getRawMany();

           return amounts;
        }
        catch (e) {
            console.log(e);
        }
    }
}

export default new TroopsService();