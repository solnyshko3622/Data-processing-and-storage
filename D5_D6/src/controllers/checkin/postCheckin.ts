import { Request, Response } from "express";
import pool from "../../utils/db";


export const checkIn = async (req: Request, res: Response): Promise<void> => {
    console.log("checking");
    const { ticket_no, passenger_info } = req.body;
    if (!ticket_no) {
        console.log("no ticket no");
        res.status(400).json({ message: "Missing or invalid 'ticket_no'" });
        return;
    }
    if (!passenger_info) {
        res.status(400).json({ message: "Missing or invalid 'passenger_info'" });
        console.log("error data");
        return;
    }

    const client = pool;

    try {
        const ticketResult = await client.query(`SELECT tf.flight_id, tf.fare_conditions 
                                                 FROM ticket_flights tf 
                                                 WHERE tf.ticket_no = $1`,
                                                [ticket_no]
                                                );

        if (ticketResult.rowCount === 0) {
            res.status(404).json({ message: "Ticket not found" });
            return;
        }

        const { flight_id, fare_conditions } = ticketResult.rows[0];

        //проверяем а вдруг такой человек уже зарегистрирован
        const existingBoarding = await client.query(
            `SELECT seat_no, boarding_no 
             FROM boarding_passes 
             WHERE ticket_no = $1 AND flight_id = $2`,
            [ticket_no, flight_id]
        );
        if (existingBoarding.rowCount) {
            const { seat_no, boarding_no } = existingBoarding.rows[0];
            res.status(200).json({
                message: "Passenger already checked in",
                seat_no,
                boarding_pass_no: boarding_no,
            });
            return;
        }

        const seatResult = await client.query(
            `SELECT seat_no 
             FROM seats 
             WHERE aircraft_code = (
                SELECT aircraft_code FROM flights WHERE flight_id = $1
             ) AND fare_conditions = $2
             EXCEPT
             SELECT seat_no 
             FROM boarding_passes 
             WHERE flight_id = $1`,
            [flight_id, fare_conditions]
        );

        if (seatResult.rowCount === 0) {
            res.status(409).json({ message: "No available seats for this fare class" });
            return;
        }
        const seat_no = seatResult.rows[0].seat_no;
        //получаем количество регистраций на рейс
        const data = await client.query(
            `SELECT max(boarding_no) from boarding_passes WHERE boarding_passes.flight_id = $1`,
            [flight_id]
        )
        const boarding_pass_no = Number(data.rows[0].max) + 1;
        console.log(data.rows[0].max)

        // Записать новую регистрацию
        try {
            await client.query(
                `INSERT INTO boarding_passes (ticket_no, flight_id, boarding_no, seat_no) 
             VALUES ($1, $2, $3, $4)`,
                [ticket_no, flight_id, boarding_pass_no, seat_no]
            );
        } catch(e) {
            res.status(400).json({ message: `Error: ${e}` });
        }

        res.status(200).json({message: "Check-in successful", seat_no, boarding_pass_no,});
    } catch (error) {
        console.error("Check-in error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};



