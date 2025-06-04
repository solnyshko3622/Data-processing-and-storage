import dotenv from "dotenv";
import express from "express";
import airportsRouter from "./routes/airportsRouter";
import bookingRouter from "./routes/bookingRouter";
import checkingRouter from "./routes/checkingRouter";
import citiesRouter from "./routes/citiesRouter";




dotenv.config();
const app = express();
app.use(express.json());
app.use('/airports', airportsRouter);
app.use('/booking', bookingRouter);
app.use('/checking', checkingRouter);
app.use('/cities', citiesRouter);


const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
