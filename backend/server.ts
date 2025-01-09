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

// Updated Sheet ranges to include all necessary columns
const RANGES = {
  CARS: 'Cars!A2:P',        // Columns A to P
  REPAIRS: 'Repairs!A2:I',  // Columns A to I
  SALES: 'Sales!A2:J',      // Columns A to J
  PARTNERS: 'Partners!A2:G' // Columns A to G
};

// Helper function to generate IDs
const generateId = (prefix: string, existingIds: string[]) => {
  let counter = existingIds.length > 0 
    ? Math.max(...existingIds.map(id => parseInt(id.replace(prefix, '')) || 0)) + 1 
    : 1;
  return `${prefix}${counter}`;
};

// Cars endpoints
app.get('/api/cars', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10; // can do Math.min(parseInt(req.q.l as str) || 10, Maximum_limit) but dk if i should
  const startRow = (page - 1) * limit + 2;
  const endRow = startRow + limit - 1;
  try {
      const [response, countResponse] = await Promise.all([sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range : `Cars!A${startRow}:P${endRow}`
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `Cars!A:A`
      })
    ]);

    const totalItems = (countResponse.data.values?.length || 0) - 1;
    const totalPages = Math.ceil(totalItems / limit);
    const cars = (response.data.values || []).map(row => ({
      id: row[0],
      make: row[1],
      model: row[2],
      year: Number(row[3]),
      color: row[4],
      registrationNumber: row[5],
      purchasePrice: Number(row[6]),
      purchaseDate: row[7],
      currentStatus: row[8],
      condition: row[9],
      sellerName: row[10],
      sellerContact: row[11],
      additionalCosts: {
        transport: row[12] ? Number(row[12]) : 0,
        inspection: row[13] ? Number(row[13]) : 0,
        other: row[14] ? Number(row[14]) : 0
      },
      totalCost: Number(row[15])
    }));
    res.json({
      data: cars,
      pagination : {
        currentPage : page,
        totalPages,
        totalItems,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ error: 'Failed to fetch cars' });
  }
});

app.post('/api/cars', async (req, res) => {
  try {
    const {
      make,
      model,
      year,
      color,
      registrationNumber,
      purchasePrice,
      purchaseDate,
      currentStatus,
      condition,
      sellerName,
      sellerContact,
      additionalCosts
    } = req.body;

    const totalCost = purchasePrice +
      (additionalCosts?.transport || 0) +
      (additionalCosts?.inspection || 0) +
      (additionalCosts?.other || 0);

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
      currentStatus,
      condition,
      sellerName,
      sellerContact,
      additionalCosts?.transport || '',
      additionalCosts?.inspection || '',
      additionalCosts?.other || '',
      totalCost
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGES.CARS,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow]
      }
    });

    res.status(201).json({
      id: newId,
      make,
      model,
      year,
      color,
      registrationNumber,
      purchasePrice,
      purchaseDate,
      currentStatus,
      condition,
      sellerName,
      sellerContact,
      additionalCosts,
      totalCost
    });
  } catch (error) {
    console.error('Error adding car:', error);
    res.status(500).json({ error: 'Failed to add car' });
  }
});

// Repairs endpoints
app.get('/api/repairs', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const startRow = (page - 1) * limit + 2; 
  const endRow = startRow + limit - 1
  try {
    const carId = req.query.carId;
    const [response, currentResponse] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range : `Repairs!A${startRow}:I${endRow}`
    }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range : `Repairs!A:A`
      })
    ]);
    
    const repairs = (response.data.values || [])
      .map(row => ({
        id: row[0],
        carId: row[1],
        repairDate: row[2],
        description: row[3],
        cost: Number(row[4]),
        mechanicName: row[5],
        serviceProvider: {
          name: row[6],
          contact: row[7],
          address: row[8]
        }
      }));

    // If carId is provided, filter repairs for that car
    const filteredRepairs = carId 
      ? repairs.filter(repair => repair.carId === carId)
      : repairs;

    res.json(filteredRepairs);
  } catch (error) {
    console.error('Error fetching repairs:', error);
    res.status(500).json({ error: 'Failed to fetch repairs' });
  }
});

app.post('/api/repairs', async (req, res) => {
  try {
    const {
      carId,
      repairDate,
      description,
      cost,
      mechanicName,
      serviceProvider
    } = req.body;

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
      repairDate,
      description,
      cost,
      mechanicName,
      serviceProvider?.name || '',
      serviceProvider?.contact || '',
      serviceProvider?.address || ''
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGES.REPAIRS,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow]
      }
    });

    res.status(201).json({
      id: newId,
      carId,
      repairDate,
      description,
      cost,
      mechanicName,
      serviceProvider
    });
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
      paymentStatus: row[7],
      totalRepairCosts: Number(row[8]),
      netProfit: Number(row[9])
    }));
    res.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

app.post('/api/sales', async (req, res) => {
  try {
    const {
      carId,
      saleDate,
      salePrice,
      buyerName,
      buyerContactInfo,
      paymentStatus
    } = req.body;

    // Get car details to retrieve totalCost
    const carResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGES.CARS
    });
    const carRow = (carResponse.data.values || []).find(row => row[0] === carId);
    if (!carRow) {
      return res.status(404).json({ error: 'Car not found' });
    }
    const totalCost = Number(carRow[15]); // Column P

    // Get total repair costs for the car
    const repairsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGES.REPAIRS
    });
    const totalRepairCosts = (repairsResponse.data.values || [])
      .filter(row => row[1] === carId)
      .reduce((sum, row) => sum + Number(row[4]), 0); // Column E: Repair Cost

    const netProfit = salePrice - totalCost - totalRepairCosts;

    // Generate new sale ID
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
      netProfit,          // Profit
      paymentStatus,
      totalRepairCosts,
      netProfit           // Net Profit
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
    const carIndex = (carResponse.data.values || []).findIndex(row => row[0] === carId);
    if (carIndex !== -1) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Cars!I${carIndex + 2}`, // Column I: Current Status
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['Sold']]
        }
      });
    }

    res.status(201).json({
      id: newId,
      carId,
      saleDate,
      salePrice,
      buyerName,
      buyerContactInfo,
      profit: netProfit,
      paymentStatus,
      totalRepairCosts,
      netProfit
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
      availableCars: cars.filter(car => car[8] === 'Available').length, // Column I: Current Status
      totalProfit: sales.reduce((sum, sale) => sum + Number(sale[6]), 0), // Column G: Profit
      recentRepairs: repairs.slice(-5).map(row => ({
        id: row[0],
        carId: row[1],
        repairDate: row[2],
        description: row[3],
        cost: Number(row[4]),
        mechanicName: row[5],
        serviceProvider: {
          name: row[6],
          contact: row[7],
          address: row[8]
        }
      })),
      recentSales: sales.slice(-5).map(row => ({
        id: row[0],
        carId: row[1],
        saleDate: row[2],
        salePrice: Number(row[3]),
        buyerName: row[4],
        buyerContactInfo: row[5],
        profit: Number(row[6]),
        paymentStatus: row[7],
        totalRepairCosts: Number(row[8]),
        netProfit: Number(row[9])
      }))
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
