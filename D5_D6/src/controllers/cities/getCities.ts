import { Request, Response } from "express";
import pool from "../../utils/db";

function getLangFromQuery(req: Request): string {
    const lang = req.query.lang as string;
    return lang || "en";
}

export const getAllCities = async (req: Request, res: Response): Promise<void> => {
    const lang = getLangFromQuery(req);

    try {
        const query = "SELECT DISTINCT city FROM airports_data";
        const result = await pool.query(query);

        const cities = result.rows.map(row => {
            try {
                const cityJson = row.city;
                console.log(cityJson);
                return cityJson[lang] || cityJson["en"];
            } catch (err) {
                console.warn("Invalid city JSON format:", err);
                return row.city;
            }
        });

        res.status(200).json({ cities });
    } catch (error) {
        console.error("Error fetching cities:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
