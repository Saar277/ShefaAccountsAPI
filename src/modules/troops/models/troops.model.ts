import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { TroopsDto } from "../Dto/troops.location.dto";
import { TroopsDtoAll } from "../Dto/troops.dto";
import { Min, Max } from "class-validator";

/**
 * This class represent an entity in the DB.
 * Each field here is a field in the DB table.
 */
export class Troops {
  id: number;


  phone: string;

  commander: string;

  amount: number;

  base: string;

  type: string;

  longitude: number;

  latitude: number;

  public static toLocationDto = (troops: Troops) => {
    const dto: TroopsDto = new TroopsDto(troops);
    return dto;
  };

  public static toDto = (troops: Troops) => {
    const dto: TroopsDtoAll = new TroopsDtoAll(troops);
    return dto;
  };
}
