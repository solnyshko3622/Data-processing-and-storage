import { Request, Response } from "express";
import pool from "../../utils/db";

export const getInboundSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
        const { airport } = req.params;
        const { origin, flight_number, arrival_time, days } = req.query;

        if (!airport) {
            res.status(400).json({ message: "Missing airport code" });
            return;
        }

        if (!origin) {
            res.status(400).json({ message: "Missing origin parameter" });
            return;
        }

        const conditions: string[] = [
            "arrival_airport = $1",
            "departure_airport = $2"
        ];
        const values: any[] = [
            airport.toUpperCase(),
            (origin as string).toUpperCase()
        ];

        let paramIndex = values.length;

        if (flight_number) {
            paramIndex++;
            conditions.push(`flight_no = $${paramIndex}`);
            values.push(flight_number);
        }

        // 🔢 Фильтр по дню недели как числу от 1 (Monday) до 7 (Sunday)
        if (days) {
            const daysArray = (days as string)
                .split(',')
                .map(d => parseInt(d.trim(), 10))
                .filter(n => n >= 1 && n <= 7);

            if (daysArray.length > 0) {
                paramIndex++;
                // TO_CHAR(..., 'ID') вернёт 1 (Понедельник) до 7 (Воскресенье)
                conditions.push(`CAST(TO_CHAR(scheduled_arrival AT TIME ZONE 'UTC', 'ID') AS INTEGER) = ANY($${paramIndex})`);
                values.push(daysArray);
            }
        }
      if (arrival_time) {
            paramIndex++;
            conditions.push(`TO_CHAR(scheduled_arrival AT TIME ZONE 'UTC', 'HH24:MI') = $${paramIndex}`);
            values.push(arrival_time);
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

        res.json({ inboundSchedule: result.rows });
    } catch (error) {
        console.error("Error fetching inbound schedule:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
