const pool = require('./db.js');

async function runQuery() {
    try {
        console.log(`Get data`);
        const priceResults = await getData();

        await createNewTable();
        console.log(`Created table pricing_rules`);

        await writeData(priceResults);
        console.log(`Data written`);
    } catch (err) {
        console.error('Ошибка:', err);
    } finally {
        pool.end();
    }
}
runQuery();

async function getData() {
    const priceQuery = `
        SELECT 
            flights.departure_airport, 
            flights.arrival_airport, 
            ticket_flights.fare_conditions, 
            flights.aircraft_code, 
            bp.seat_no, 
            AVG(ticket_flights.amount) AS avg_price, 
            MIN(ticket_flights.amount) AS min_price, 
            MAX(ticket_flights.amount) AS max_price
        FROM ticket_flights
        JOIN flights ON flights.flight_id = ticket_flights.flight_id
        JOIN boarding_passes bp ON bp.ticket_no = ticket_flights.ticket_no AND bp.flight_id = flights.flight_id
        GROUP BY 
            flights.departure_airport, 
            flights.arrival_airport, 
            ticket_flights.fare_conditions, 
            bp.seat_no, 
            flights.aircraft_code;
    `;
    return await pool.query(priceQuery);
}

async function createNewTable() {
    const dropTableQuery = `
        DROP TABLE IF EXISTS pricing_rules;
    `;
    await pool.query(dropTableQuery);

    const createTableQuery = `
        CREATE TABLE pricing_rules (
            fare_conditions VARCHAR(255),
            avg_price DECIMAL,
            min_price DECIMAL,
            max_price DECIMAL,
            arrival_airport VARCHAR(255), 
            departure_airport VARCHAR(255),
            aircraft_code VARCHAR(10),
            seat_no VARCHAR(10),
            rule_applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (fare_conditions, arrival_airport, departure_airport, aircraft_code, seat_no)
        );
    `;
    return await pool.query(createTableQuery);
}

async function writeData(priceResults) {
    for (const row of priceResults.rows) {
        const insertQuery = `
            INSERT INTO pricing_rules (
                fare_conditions, avg_price, min_price, max_price, arrival_airport, departure_airport, aircraft_code, seat_no
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

        await pool.query(insertQuery, [
            row.fare_conditions,
            row.avg_price,
            row.min_price,
            row.max_price,
            row.arrival_airport,
            row.departure_airport,
            row.aircraft_code,
            row.seat_no
        ]);
    }
}
