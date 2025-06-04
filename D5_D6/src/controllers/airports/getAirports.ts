import { Request, Response } from "express";
import pool from "../../utils/db";

function getLangFromQuery(req: Request): string {
    const lang = req.query.lang as string;
    return lang || "en";
}

export const getAllAirports = async (req: Request, res: Response): Promise<void> => {
    const lang = getLangFromQuery(req);
    try {
        const query = "SELECT DISTINCT airport_name FROM airports_data";
        const result = await pool.query(query);
        const airports = result.rows.map(row => {
            const airportJson = row.airport_name;
            return airportJson[lang] || airportJson["en"];
        });
        res.status(200).json({ airports: airports});
    } catch (error) {
        console.error("Error fetching airports:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
