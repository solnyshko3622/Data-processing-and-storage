import express from "express";
import {getAllAirports} from "../controllers/airports/getAirports";
import {getInboundSchedule} from "../controllers/airports/getInboundSchedule";
import {getOutboundSchedule} from "../controllers/airports/getOutboundSchedule";

const airportsRouter = express.Router();

airportsRouter.get("/", getAllAirports)

airportsRouter.get("/:airport/inbound-schedule", getInboundSchedule)

airportsRouter.get("/:airport/outbound-schedule", getOutboundSchedule)

export default airportsRouter
