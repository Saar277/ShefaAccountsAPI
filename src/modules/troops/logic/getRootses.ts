import { TroopsDto } from "../Dto/troops.location.dto";
import { Troops } from "../models/troops.model";
import { TroopsDtoAll } from "../Dto/troops.dto";
import { TypesDto } from "../Dto/types.amount.dto";
import troopsService from "../services/troops.service";

/**
 * This class is responsible for the logic of the moudule.
 * For example - excute transformation, calcualtion and etc...
 */
class GetTroopsLogic {

    getAllTroopses = async (): Promise<TroopsDto[]> => {
        const troopses: Troops[] = await troopsService.getTroops();
        const troopsesDto: TroopsDto[] = troopses.map((troops) =>
        Troops.toLocationDto(troops));
        return troopsesDto;
    };

    getTroopsById = async (id: number): Promise<TroopsDtoAll> => {
        const troops: Troops = await troopsService.getTroopsById(id);
        const troopsDto: TroopsDtoAll = Troops.toDto(troops);
        return troopsDto;
    }

    getAmountsByType = async (): Promise<TypesDto[]> => {
        const types: any[] = await troopsService.getAmountByType();
        const typesDto: TypesDto[] = types.map((type) =>
        this._toTypeDto(type));
        return typesDto;
    }

    _toTypeDto = (typeData: any) => {
        const typeDto = new TypesDto(typeData);
        return typeDto;
    }
}

export default new GetTroopsLogic();
