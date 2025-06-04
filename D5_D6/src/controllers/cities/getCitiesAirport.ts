import { Request, Response } from "express";
import pool from "../../utils/db";

export const getAirportsByCity = async (req: Request, res: Response): Promise<void> => {
    const { city } = req.params;
    const lang = req.query.lang === 'ru' ? 'ru' : 'en';

    try {
        const query = `
            SELECT airport_name
            FROM airports_data
            WHERE city ->> $1 = $2
        `;

        const result = await pool.query(query, [lang, city]);
        const airports = result.rows.map(row => {
            return row.airport_name[lang];
        });

        res.status(200).json(airports);
    } catch (error) {
        console.error("Error fetching airports for city:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
