import { Request, Response } from "express";
import pool from "../../utils/db";

export const getOutboundSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
        const { airport } = req.params;
        const { destination, flight_number, departure_time, days } = req.query;

        if (!airport) {
            res.status(400).json({ message: "Missing airport code" });
            return;
        }

        if (!destination) {
            res.status(400).json({ message: "Missing destination parameter" });
            return;
        }

        const conditions: string[] = [
            "departure_airport = $1",
            "arrival_airport = $2"
        ];
        const values: any[] = [
            airport.toUpperCase(),
            (destination as string).toUpperCase()
        ];

        let paramIndex = values.length;

        if (flight_number) {
            paramIndex++;
            conditions.push(`flight_no = $${paramIndex}`);
            values.push(flight_number);
        }

        // 🔢 Фильтр по дню недели (1–7, Mon–Sun) по локальному времени
        if (days) {
            const daysArray = (days as string)
                .split(',')
                .map(d => parseInt(d.trim(), 10))
                .filter(n => n >= 1 && n <= 7);

            if (daysArray.length > 0) {
                paramIndex++;
                conditions.push(`CAST(TO_CHAR(scheduled_departure AT TIME ZONE 'UTC' AT TIME ZONE '+07:00', 'ID') AS INTEGER) = ANY($${paramIndex})`);
                values.push(daysArray);
            }
        }

        // ⏰ Фильтр по времени вылета в формате HH:MM, по локальному времени (UTC+7)
        if (departure_time) {
            paramIndex++;
            conditions.push(`TO_CHAR(scheduled_departure AT TIME ZONE 'UTC' AT TIME ZONE '+07:00', 'HH24:MI') = $${paramIndex}`);
            values.push(departure_time);
        }

        const query = `
            SELECT 
                flight_id,
                flight_no,
                scheduled_departure,
                scheduled_arrival,
                departure_airport,
                arrival_airport,
                status,
                aircraft_code,
                actual_departure,
                actual_arrival
            FROM flights
            WHERE ${conditions.join(' AND ')}
        `;

        const result = await pool.query(query, values);

        res.json({ outboundSchedule: result.rows });
    } catch (error) {
        console.error("Error fetching outbound schedule:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
