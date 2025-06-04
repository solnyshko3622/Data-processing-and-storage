import express from "express";
import {createBooking} from "../controllers/booking/postBooking";

const bookingRouter = express.Router();


bookingRouter.post("/", createBooking)
export default bookingRouter;
