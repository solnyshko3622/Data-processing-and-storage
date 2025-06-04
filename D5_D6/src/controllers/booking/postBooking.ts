import { Request, Response } from "express";
import pool from "../../utils/db";
import { v4 as uuidv4 } from "uuid";


//описание пассажира, немного отличается от задания
interface Passenger {
    name: string;
    constacts: {
        phone?: string,
        email?: string
    }
    passport: string,
    fare_conditions: string,
    amount: number;
}

export const createBooking = async (req: Request, res: Response): Promise<void> => {
    const requestIdRaw = req.headers['requestid'] || req.headers['x-request-id'];
    const requestId = typeof requestIdRaw === 'string' ? requestIdRaw : uuidv4();

    console.log(`[${requestId}] Received booking request`);

    const { flight_ids, passengers } = req.body;
    let parsePassengers: Passenger[] = [];

    // Проверка параметров
    if (!Array.isArray(flight_ids) || flight_ids.length === 0) {
        res.status(400).json({ requestId, message: "Missing or invalid 'flight_ids'" });
        return;
    }

    if (!Array.isArray(passengers) || passengers.length === 0) {
        res.status(400).json({ requestId, message: "Missing or invalid 'passengers'" });
        return;
    }

    try {
        // Проверка, существует ли уже бронь с этим requestId
        const existingBooking = await pool.query(
            `SELECT book_ref FROM bookings WHERE request_id = $1`,
            [requestId]
        );

        if (existingBooking.rows.length > 0) {
            const existingRef = existingBooking.rows[0].book_ref;

            // Получаем номера билетов
            const ticketsResult = await pool.query(
                `SELECT ticket_no FROM tickets WHERE book_ref = $1`,
                [existingRef]
            );

            const existingTickets = ticketsResult.rows.map(row => row.ticket_no);

            console.log(`[${requestId}] Booking already exists, returning existing booking`);
            res.status(200).json({ requestId, book_ref: existingRef, tickets: existingTickets });
            return;
        }

        // Парсинг пассажиров
        for (let passenger of passengers) {
            parsePassengers.push({
                name: passenger.name,
                constacts: {
                    email: passenger.email || "",
                    phone: passenger.phone || "",
                },
                passport: passenger.passport,
                amount: passenger.amount,
                fare_conditions: passenger.fare_condition || "Economy",
            });
        }

        // Проверка мест на каждом рейсе
        for (const flight_id of flight_ids) {
            const result = await pool.query(
                `
                SELECT 
                    f.flight_id, 
                    f.aircraft_code,
                    (SELECT COUNT(*) FROM seats WHERE aircraft_code = f.aircraft_code) AS total_seats,
                    (SELECT COUNT(*) FROM ticket_flights WHERE flight_id = f.flight_id) AS booked_seats
                FROM flights f
                WHERE f.flight_id = $1
                `,
                [flight_id]
            );

            const data = result.rows[0];
            if (!data) {
                res.status(400).json({ requestId, message: `Flight ${flight_id} not found` });
                return;
            }

            const availableSeats = parseInt(data.total_seats) - parseInt(data.booked_seats);
            if (availableSeats < passengers.length) {
                res.status(400).json({ requestId, message:`Not enough seats on flight ${flight_id}` });
                return;
            }
        }

        const book_ref = uuidv4().slice(0, 6).toUpperCase();

        await pool.query(
            `INSERT INTO bookings (book_ref, book_date, total_amount, request_id) VALUES ($1, NOW(), $2, $3)`,
            [book_ref, parsePassengers.reduce((acc, p) => acc + p.amount, 0), requestId]
        );

        const ticket_nos: string[] = [];

        for (const passenger of parsePassengers) {
            const ticket_no = uuidv4().replace(/-/g, "").slice(0, 13).toUpperCase();
            ticket_nos.push(ticket_no);
            await pool.query(
                `INSERT INTO tickets (ticket_no, book_ref, passenger_id, passenger_name, contact_data) VALUES ($1, $2, $3, $4, $5)`,
                [ticket_no, book_ref, passenger.passport, passenger.name, passenger.constacts]
            );

            for (const flight_id of flight_ids) {
                await pool.query(
                    `INSERT INTO ticket_flights (ticket_no, flight_id, fare_conditions, amount) VALUES ($1, $2, $3, $4)`,
                    [ticket_no, flight_id, passenger.fare_conditions, passenger.amount]
                );
            }
        }

        console.log(`[${requestId}] Booking created successfully: ${book_ref}`);
        res.status(201).json({ requestId, book_ref, tickets: ticket_nos });
    } catch (err) {
        console.error(`[${requestId}] Booking failed:`, err);
        res.status(400).json({
            requestId,
            message: err instanceof Error ? err.message : "Booking error"
        });
    }
};
