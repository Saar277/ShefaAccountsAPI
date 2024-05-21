import "reflect-metadata";
import { DataSource } from "typeorm";
import { Htmr } from "./modules/htmr/models/htmrModel";
import { Sensor } from "./modules/sensor/models/sensor.model";
import { ObservationArea } from "./modules/sensor/models/observationArea.model";
import { Troops } from "./modules/troops/models/troops.model";
import { locationHtmr } from "./modules/htmr/models/locationModel";
import { Event } from "./modules/event/models/event.model"
import { Hospital } from "./modules/hospital/models/hospital.model";
import { Recommend } from "./modules/recommendations/models/recommend.model";
require("dotenv").config();

/**
 * configuration for the DB
 */
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: true,
  logging: false,
  entities: [Sensor, Troops, Event, Htmr, locationHtmr, ObservationArea, Hospital, Recommend],
  migrations: [],
  subscribers: [],
});
