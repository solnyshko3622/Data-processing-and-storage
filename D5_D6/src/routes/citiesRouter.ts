import express from "express";
import airportsRouter from "./airportsRouter";
import {getAirportsByCity} from "../controllers/cities/getCitiesAirport";
import {getAllAirports} from "../controllers/airports/getAirports";
import {getAllCities} from "../controllers/cities/getCities";

const citiesRouter = express.Router();

citiesRouter.get("/", getAllCities)
citiesRouter.get("/airportsByCity/:city", getAirportsByCity)





export default citiesRouter;
