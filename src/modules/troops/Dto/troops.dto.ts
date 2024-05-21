import { Troops } from "../models/troops.model";

/**
 * This class represent a smaller part of the entity.
 * Its includes only the relavnt fields we want to display.
 */
export class TroopsDtoAll {
  longitude: number;
  latitude: number;
  type: string;
  base: string;
  amount: number;
  commander: string;
  phone: string;
  id: number;

  constructor(troopEntity: Troops) {
    this.longitude = troopEntity.longitude;
    this.latitude = troopEntity.latitude;
    this.type = troopEntity.type;
    this.base = troopEntity.base;
    this.amount = troopEntity.amount;
    this.commander = troopEntity.commander;
    this.phone = troopEntity.phone;
    this.id = troopEntity.id;
  }
}
