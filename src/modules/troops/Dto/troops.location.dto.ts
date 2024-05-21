import { Troops } from "../models/troops.model";

/**
 * This class represent a smaller part of the entity.
 * Its includes only the relavnt fields we want to display.
 */
export class TroopsDto {
  longitude: number;
  latitude: number;
  id: number;

  constructor(troopEntity: Troops) {
    this.longitude = troopEntity.longitude;
    this.latitude = troopEntity.latitude;
    this.id = troopEntity.id;
  }
}
