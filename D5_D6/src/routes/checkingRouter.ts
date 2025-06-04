import express from "express";
import {checkIn} from "../controllers/checkin/postCheckin";

const checkingRouter = express.Router();

checkingRouter.put("/", checkIn)
export default checkingRouter;
