import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Google Sheets Setup
const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'keys.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// Sheet ranges
const RANGES = {
    CARS: 'Cars!A2:J',
    REPAIRS: 'Repairs!A2:F',
    SALES: 'Sales!A2:H',
    PARTNERS: 'Partners!A2:E'
};

// Helper function to generate IDs
const generateId = (prefix: string, existingIds: string[]) => {
    let counter = 1;
    let newId = `${prefix}${String(counter).padStart(3, '0')}`;
    while (existingIds.includes(newId)) {
        counter++;
        newId = `${prefix}${String(counter).padStart(3, '0')}`;
    }
    return newId;
};

// Cars endpoints
app.get('/api/cars', async (req, res) => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGES.CARS
        });
        
        const cars = (response.data.values || []).map(row => ({
            id: row[0],
            make: row[1],
            model: row[2],
            year: row[3],
            color: row[4],
            registrationNumber: row[5],
            purchasePrice: Number(row[6]),
            purchaseDate: row[7],
            currentStatus: row[8],
            condition: row[9]
        }));

        res.json(cars);
    } catch (error) {
        console.error('Error fetching cars:', error);
        res.status(500).json({ error: 'Failed to fetch cars' });
    }
});

app.post('/api/cars', async (req, res) => {
    try {
        const { make, model, year, color, registrationNumber, purchasePrice, purchaseDate, currentStatus, condition } = req.body;

        // Get existing cars to generate new ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGES.CARS
        });
        
        const existingIds = (response.data.values || []).map(row => row[0]);
        const newId = generateId('C', existingIds);

        const newRow = [
            newId,
            make,
            model,
            year,
            color,
            registrationNumber,
            purchasePrice,
            purchaseDate,
            'Available', // Default status
            condition
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGES.CARS,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [newRow]
            }
        });

        res.status(201).json({ id: newId, ...req.body, currentStatus: 'Available' });
    } catch (error) {
        console.error('Error adding car:', error);
        res.status(500).json({ error: 'Failed to add car' });
    }
});

// Repairs endpoints
app.get('/api/repairs', async (req, res) => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGES.REPAIRS
        });
        
        const repairs = (response.data.values || []).map(row => ({
            id: row[0],
            carId: row[1],
            date: row[2],
            description: row[3],
            cost: Number(row[4]),
            mechanic: row[5]
        }));

        res.json(repairs);
    } catch (error) {
        console.error('Error fetching repairs:', error);
        res.status(500).json({ error: 'Failed to fetch repairs' });
    }
});

app.post('/api/repairs', async (req, res) => {
    try {
        const { carId, date, description, cost, mechanic } = req.body;

        // Get existing repairs to generate new ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGES.REPAIRS
        });
        
        const existingIds = (response.data.values || []).map(row => row[0]);
        const newId = generateId('R', existingIds);

        const newRow = [
            newId,
            carId,
            date,
            description,
            cost,
            mechanic
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGES.REPAIRS,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [newRow]
            }
        });

        res.status(201).json({ id: newId, ...req.body });
    } catch (error) {
        console.error('Error adding repair:', error);
        res.status(500).json({ error: 'Failed to add repair' });
    }
});

// Sales endpoints
app.get('/api/sales', async (req, res) => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGES.SALES
        });
        
        const sales = (response.data.values || []).map(row => ({
            id: row[0],
            carId: row[1],
            saleDate: row[2],
            salePrice: Number(row[3]),
            buyerName: row[4],
            buyerContactInfo: row[5],
            profit: Number(row[6]),
            paymentStatus: row[7]
        }));

        res.json(sales);
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ error: 'Failed to fetch sales' });
    }
});

app.post('/api/sales', async (req, res) => {
    try {
        const { carId, saleDate, salePrice, buyerName, buyerContactInfo } = req.body;

        // Get car details to calculate profit
        const carResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGES.CARS
        });
        
        const car = (carResponse.data.values || [])
            .find(row => row[0] === carId);
        
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }

        const purchasePrice = Number(car[6]);
        const profit = salePrice - purchasePrice;

        // Get existing sales to generate new ID
        const salesResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGES.SALES
        });
        
        const existingIds = (salesResponse.data.values || []).map(row => row[0]);
        const newId = generateId('S', existingIds);

        const newRow = [
            newId,
            carId,
            saleDate,
            salePrice,
            buyerName,
            buyerContactInfo,
            profit,
            'Pending' // Default payment status
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGES.SALES,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [newRow]
            }
        });

        // Update car status to Sold
        const carIndex = (carResponse.data.values || [])
            .findIndex(row => row[0] === carId);
        
        if (carIndex !== -1) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `Cars!I${carIndex + 2}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [['Sold']]
                }
            });
        }

        res.status(201).json({
            id: newId,
            ...req.body,
            profit,
            paymentStatus: 'Pending'
        });
    } catch (error) {
        console.error('Error adding sale:', error);
        res.status(500).json({ error: 'Failed to add sale' });
    }
});

// Dashboard endpoints
app.get('/api/dashboard', async (req, res) => {
    try {
        const [carsResponse, salesResponse, repairsResponse] = await Promise.all([
            sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: RANGES.CARS
            }),
            sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: RANGES.SALES
            }),
            sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: RANGES.REPAIRS
            })
        ]);

        const cars = carsResponse.data.values || [];
        const sales = salesResponse.data.values || [];
        const repairs = repairsResponse.data.values || [];

        const metrics = {
            totalCars: cars.length,
            availableCars: cars.filter(car => car[8] === 'Available').length,
            totalProfit: sales.reduce((sum, sale) => sum + Number(sale[6]), 0),
            recentRepairs: repairs.slice(-5),
            recentSales: sales.slice(-5)
        };

        res.json(metrics);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});