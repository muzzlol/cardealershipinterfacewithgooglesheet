import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { createOrGetFolder, uploadFile, deleteFile } from './drive-service.js';

dotenv.config();

// Types and Interfaces
interface PaginationParams {
  page: number;
  limit: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
}

// Validation utilities
const validatePaginationParams = (query: any): PaginationParams => {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(Math.max(1, parseInt(query.limit as string) || 10), 1000); // Max 1000 items per page
  return { page, limit };
};

const validateEnvironmentVariables = () => {
  const required = ['SPREADSHEET_ID'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

const createPaginatedResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  totalItems: number
): PaginatedResponse<T> => {
  return {
    data,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
      limit,
    },
  };
};

const app = express();
const PORT = process.env.PORT || 3000;

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Get users from the Users sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGES.USERS
    });

    const users = response.data.values || [];
    const user = users.find(row => row[1] === username && row[2] === password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate a simple token (in production, use a proper JWT)
    const token = Buffer.from(`${username}-${Date.now()}`).toString('base64');
    res.json({ token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Token validation endpoint
app.get('/api/auth/validate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = Buffer.from(token, 'base64').toString();
    const [username] = decodedToken.split('-');

    // Verify user exists
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGES.USERS
    });

    const users = response.data.values || [];
    const userExists = users.some(row => row[1] === username);

    if (!userExists) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({ valid: true });
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Google Sheets Setup
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'keys.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});
const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

validateEnvironmentVariables();

// SHEET RNGES
const RANGES = {
  CARS: 'Cars!A2:V',        // 22 columns (A to V)
  REPAIRS: 'Repairs!A2:I',  // 9 columns (A to I)
  SALES: 'Sales!A2:J',      // 10 columns (A to J)
  PARTNERS: 'Partners!A2:E', // 5 columns (A to E)
  RENTALS: 'Rentals!A2:O',  // 15 columns (A to O)
  USERS: 'Users!A2:C',      // 3 columns (A to C: ID, Username, Password)
};

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Initialize Drive folders
let documentsFolderId: string;
let photosFolderId: string;

async function initializeDriveFolders() {
  try {
    documentsFolderId = await createOrGetFolder('CarDealership_Documents');
    photosFolderId = await createOrGetFolder('CarDealership_Photos');
  } catch (error) {
    console.error('Error initializing Drive folders:', error);
  }
}

initializeDriveFolders();

// Fetch all data 
app.get('/api/data', async (req, res) => {
  try {
    const [carsResponse, repairsResponse, salesResponse, partnersResponse, rentalsResponse] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: RANGES.CARS }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: RANGES.REPAIRS }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: RANGES.SALES }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: RANGES.PARTNERS }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: RANGES.RENTALS }),
    ]);

    const data = {
      cars: carsResponse.data || [], // .values to get just entries
      repairs: repairsResponse.data || [],
      sales: salesResponse.data || [],
      partners: partnersResponse.data || [],
      rentals: rentalsResponse.data || []
    };

    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Helper function to generate IDs
const generateId = (prefix: string, existingIds: string[]) => {
  let counter = existingIds.length > 0 
    ? Math.max(...existingIds.map(id => parseInt(id.replace(prefix, '')) || 0)) + 1 
    : 1;
  return `${prefix}${counter}`;
};

// fethcing avaliable and on rent cars for helping with forms
app.get('/api/cars/available', async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGES.CARS
    });

    const cars = (response.data.values || [])
      .filter(row => row[8] !== 'Sold') // filter out sold cars keep available and on rent 
      .map(row => ({
        id: row[0],
        make: row[1],
        model: row[2],
        year: Number(row[3]),
        color: row[4],
        registrationNumber: row[5],
        currentStatus: row[8],
        condition: row[9],
        location: row[16]
      }));

    res.json(cars);
  } catch (error) {
    console.error('Error fetching available cars:', error);
    res.status(500).json({ error: 'Failed to fetch available cars' });
  }
});

// CARS ENDPOINTS

app.get('/api/cars', async (req, res) => {
  const { page, limit } = validatePaginationParams(req.query);
  const startRow = (page - 1) * limit + 2;
  const endRow = startRow + limit - 1;
  try {
      const [response, countResponse] = await Promise.all([sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range : RANGES.CARS
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `Cars!A:A`
      })
    ]);

    const totalItems = (countResponse.data.values?.length || 0) - 1;
    const allCars = (response.data.values || []).map(row => ({
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
      transportCost: Number(row[12]) || 0,
      inspectionCost: Number(row[13]) || 0,
      otherCosts: Number(row[14]) || 0,
      totalCost: Number(row[15]),
      location: row[16],
      documents: row[17],
      photo: row[18],
      investmentSplit: row[19],
      profitLoss: Number(row[20] || 0),
      partnerReturns: row[21] || ''
    }));
    
    // Apply pagination to the cars array
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCars = allCars.slice(startIndex, endIndex);
    
    res.json(createPaginatedResponse(paginatedCars, page, limit, totalItems));
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ error: 'Failed to fetch cars' });
  }
});

app.post('/api/cars', upload.fields([
  { name: 'documents', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      make,
      model,
      year,
      color,
      registrationNumber,
      purchasePrice,
      purchaseDate,
      condition,
      sellerName,
      sellerContact,
      transportCost,
      inspectionCost,
      otherCosts,
      location,
      investmentSplit
    } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    // Upload files to Google Drive
    const documentsUrl = files.documents ? 
      await uploadFile(files.documents[0], documentsFolderId, 'document') : '';
    const photoUrl = files.photo ? 
      await uploadFile(files.photo[0], photosFolderId, 'photo') : '';

    // Get existing cars to generate new ID
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGES.CARS
    });
    const existingIds = (response.data.values || []).map(row => row[0]);
    const newId = generateId('C', existingIds);

    // Create row data with null for formula columns
    const newRow = [
      newId,                // A - Car ID
      make,                 // B - Make
      model,               // C - Model
      year,                // D - Year
      color,               // E - Color
      registrationNumber,  // F - Registration Number
      purchasePrice,       // G - Purchase Price
      purchaseDate,        // H - Purchase Date
      null,                // I - Current Status (formula)
      condition,           // J - Condition
      sellerName,          // K - Seller Name
      sellerContact,       // L - Seller Contact
      transportCost || '0',    // M - Transport Cost
      inspectionCost || '0',   // N - Inspection Cost
      otherCosts  || '0',        // O - Other Costs
      null,                // P - Total Cost (formula)
      location || '',      // Q - Location
      documentsUrl,        // R - Documents
      photoUrl,           // S - Photo
      investmentSplit,     // T - Investment Split
      null,                // U - Profit/Loss (formula)
      null                 // V - Partner Returns (formula)
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
      condition,
      sellerName,
      sellerContact,
      transportCost,
      inspectionCost,
      otherCosts,
      location,
      documents: documentsUrl,
      photo: photoUrl,
      investmentSplit
    });
  } catch (error) {
    console.error('Error adding car:', error);
    res.status(500).json({ error: 'Failed to add car' });
  }
});

// Update existing car
app.put('/api/cars/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get current car data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGES.CARS
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === id);
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const currentRow = rows[rowIndex];
    const updatedRow = [
      id,
      updates.make || currentRow[1],
      updates.model || currentRow[2],
      updates.year || currentRow[3],
      updates.color || currentRow[4],
      updates.registrationNumber || currentRow[5],
      Number(updates.purchasePrice) || Number(currentRow[6]),
      updates.purchaseDate || currentRow[7],
      currentRow[8], // currentStatus (formula-driven)
      updates.condition || currentRow[9],
      updates.sellerName || currentRow[10],
      updates.sellerContact || currentRow[11],
      Number(updates.transportCost) || Number(currentRow[12]),
      Number(updates.inspectionCost) || Number(currentRow[13]),
      Number(updates.otherCosts) || Number(currentRow[14]),
      currentRow[15], // totalCost (formula-driven)
      updates.location || currentRow[16],
      currentRow[17],
      currentRow[18],
      updates.investmentSplit || currentRow[19],
      currentRow[20], // profitLoss (formula-driven)
      currentRow[21]  // partnerReturns (formula-driven)
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Cars!A${rowIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow]
      }
    });

    res.json({
      message: 'Car updated successfully',
      data: {
        ...updates,
        id,
      }
    });
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).json({ error: 'Failed to update car' });
  }
});

// Repairs endpoints
app.get('/api/repairs', async (req, res) => {
  const { page, limit } = validatePaginationParams(req.query);
  const startRow = (page - 1) * limit + 2; 
  const endRow = startRow + limit - 1
  try {
    const carId = req.query.carId;
    const [response, countResponse] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range : RANGES.REPAIRS
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
        serviceProviderName: row[6],
        serviceProviderContact: row[7],
        serviceProviderAddress: row[8]
      }));

    // If carId is provided, filter repairs for that car
    const filteredRepairs = carId 
      ? repairs.filter(repair => repair.carId === carId)
      : repairs;

    const totalItems = (countResponse.data.values?.length || 0) - 1;
    res.json(createPaginatedResponse(filteredRepairs, page, limit, totalItems));
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
      serviceProviderName,
      serviceProviderContact,
      serviceProviderAddress
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
      serviceProviderName || '',
      serviceProviderContact || '',
      serviceProviderAddress || ''
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
      serviceProviderName,
      serviceProviderContact,
      serviceProviderAddress
    });
  } catch (error) {
    console.error('Error adding repair:', error);
    res.status(500).json({ error: 'Failed to add repair' });
  }
});

// Sales endpoints
app.get('/api/sales', async (req, res) => {
  const { page, limit } = validatePaginationParams(req.query);
  const startRow = (page - 1) * limit + 2;
  const endRow = startRow + limit - 1;
  try {
    const [response, countResponse] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGES.SALES
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sales!A:A'
      })
    ]);

    const totalItems = (countResponse.data.values?.length || 0) - 1;
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

    res.json(createPaginatedResponse(sales, page, limit, totalItems));
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

    // Validate required fields
    const requiredFields = ['carId', 'saleDate', 'salePrice', 'buyerName', 'buyerContactInfo', 'paymentStatus'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }

    // Check if car exists and is not sold
    const carResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGES.CARS
    });
    const carRow = (carResponse.data.values || []).find(row => row[0] === carId);
    if (!carRow) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // Check if car is already sold
    if (carRow[8] === 'Sold') {
      return res.status(400).json({ error: 'Car is already sold' });
    }

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
      '', // Profit (formula-driven)
      paymentStatus,
      '', // Total Repair Costs (formula-driven)
      ''  // Net Profit (formula-driven)
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
      paymentStatus
    });
  } catch (error) {
    console.error('Error adding sale:', error);
    res.status(500).json({ error: 'Failed to add sale' });
  }
});

// Get most recent entries
app.get('/api/recent-entries', async (req, res) => {
  try {
    // Validate environment variables
    if (!SPREADSHEET_ID) {
      throw new Error('SPREADSHEET_ID is not configured');
    }

    // Fetch last 5 entries from each sheet
    const [carsResponse, repairsResponse, salesResponse, rentalsResponse] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGES.CARS,
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGES.REPAIRS,
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGES.SALES,
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGES.RENTALS,
      }),
    ]);

    // Safely get values with empty array fallback
    const cars = (carsResponse.data.values || []).slice(-5).map(row => ({
      id: row[0],
      make: row[1],
      model: row[2],
      year: parseInt(row[3]) || 0,
      color: row[4],
      registrationNumber: row[5],
      purchasePrice: parseFloat(row[6]) || 0,
      purchaseDate: row[7],
      currentStatus: row[8],
      condition: row[9],
      sellerName: row[10],
      sellerContact: row[11],
      transportCost: parseFloat(row[12]) || 0,
      inspectionCost: parseFloat(row[13]) || 0,
      otherCosts: parseFloat(row[14]) || 0,
      totalCost: parseFloat(row[15]) || 0,
      location: row[16],
      documents: row[17],
      photo: row[18],
      investmentSplit: row[19],
      profitLoss: parseFloat(row[20]) || 0,
      partnerReturns: row[21]
    })).filter(car => car.id);

    const repairs = (repairsResponse.data.values || []).slice(-5).map(row => ({
      id: row[0],
      carId: row[1],
      repairDate: row[2],
      description: row[3],
      cost: parseFloat(row[4]) || 0,
      mechanicName: row[5],
      serviceProviderName: row[6] || '',
      serviceProviderContact: row[7] || '',
      serviceProviderAddress: row[8] || ''
    })).filter(repair => repair.id);

    const sales = (salesResponse.data.values || []).slice(-5).map(row => ({
      id: row[0],
      carId: row[1],
      saleDate: row[2],
      salePrice: parseFloat(row[3]) || 0,
      buyerName: row[4],
      buyerContactInfo: row[5],
      profit: parseFloat(row[6]) || 0,
      paymentStatus: row[7],
      totalRepairCosts: parseFloat(row[8]) || 0,
      netProfit: parseFloat(row[9]) || 0
    })).filter(sale => sale.id);

    const rentals = (rentalsResponse.data.values || []).slice(-5).map(row => ({
      id: row[0],
      carId: row[1],
      customerName: row[2],
      customerContact: row[3],
      startDate: row[4],
      returnDate: row[5],
      daysLeft: parseInt(row[6]) || 0,
      daysOut: parseInt(row[7]) || 0,
      dailyRate: parseFloat(row[8]) || 0,
      totalRentEarned: parseFloat(row[9]) || 0,
      damageFee: parseFloat(row[10]) || 0,
      lateFee: parseFloat(row[11]) || 0,
      otherFee: parseFloat(row[12]) || 0,
      additionalCostsDescription: row[13] || '',
      rentalStatus: row[14] || 'Active'
    })).filter(rental => rental.id);

    res.json({
      cars,
      repairs,
      sales,
      rentals,
    });
  } catch (error) {
    console.error('Error fetching recent entries:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent entries',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update existing repair
app.put('/api/repairs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGES.REPAIRS
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Repair not found' });
    }

    const currentRow = rows[rowIndex];
    const updatedRow = [
      id,
      updates.carId || currentRow[1],
      updates.repairDate || currentRow[2],
      updates.description || currentRow[3],
      Number(updates.cost) || Number(currentRow[4]),
      updates.mechanicName || currentRow[5],
      updates.serviceProviderName || currentRow[6],
      updates.serviceProviderContact || currentRow[7],
      updates.serviceProviderAddress || currentRow[8]
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Repairs!A${rowIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow]
      }
    });

    res.json({
      message: 'Repair updated successfully',
      data: updates
    });
  } catch (error) {
    console.error('Error updating repair:', error);
    res.status(500).json({ error: 'Failed to update repair' });
  }
});

// Update existing sale
app.put('/api/sales/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGES.SALES
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const currentRow = rows[rowIndex];
    const updatedRow = [
      id,
      updates.carId || currentRow[1],
      updates.saleDate || currentRow[2],
      Number(updates.salePrice) || Number(currentRow[3]),
      updates.buyerName || currentRow[4],
      updates.buyerContactInfo || currentRow[5],
      currentRow[6], // profit (formula-driven)
      updates.paymentStatus || currentRow[7],
      currentRow[8], // totalRepairCosts (formula-driven)
      currentRow[9]  // netProfit (formula-driven)
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Sales!A${rowIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow]
      }
    });

    res.json({
      message: 'Sale updated successfully',
      data: updates
    });
  } catch (error) {
    console.error('Error updating sale:', error);
    res.status(500).json({ error: 'Failed to update sale' });
  }
});

// Rental endpoints
app.get('/api/rentals', async (req, res) => {
  const { page, limit } = validatePaginationParams(req.query);
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGES.RENTALS
    });

    const rentals = response.data.values?.map((row: any[]) => ({
      id: row[0],
      carId: row[1],
      customerName: row[2],
      customerContact: row[3],
      startDate: row[4],
      returnDate: row[5],
      daysLeft: Number(row[6]),
      daysOut: Number(row[7]),
      dailyRate: Number(row[8]),
      totalRentEarned: Number(row[9]),
      damageFee: Number(row[10]) || 0,
      lateFee: Number(row[11]) || 0,
      otherFee: Number(row[12]) || 0,
      additionalCostsDescription: row[13] || '',
      rentalStatus: row[14] // Ensure rental status is included
    })) || [];

    const totalResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Rentals!A:A',
    });
    const totalItems = (totalResponse.data.values?.length || 0) - 1;

    res.json(createPaginatedResponse(rentals, page, limit, totalItems));
  } catch (error) {
    console.error('Error fetching rentals:', error);
    res.status(500).json({ error: 'Failed to fetch rentals' });
  }
});

app.post('/api/rentals', async (req, res) => {
  try {
    const {
      carId,
      customerName,
      customerContact,
      startDate,
      returnDate,
      dailyRate,
      damageFee,
      lateFee,
      otherFee,
      additionalCostsDescription
    } = req.body;

    // Validate required fields
    const requiredFields = ['carId', 'customerName', 'customerContact', 'startDate', 'returnDate', 'dailyRate'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }

    // Check if car exists and is available
    const carResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGES.CARS
    });
    const carRow = (carResponse.data.values || []).find(row => row[0] === carId);
    if (!carRow) {
      return res.status(404).json({ error: 'Car not found' });
    }
    if (carRow[8] !== 'Available') {
      return res.status(400).json({ error: 'Car is not available for rent' });
    }

    // Generate new rental ID
    const rentalsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGES.RENTALS
    });
    const existingIds = (rentalsResponse.data.values || []).map(row => row[0]);
    const newId = generateId('RN', existingIds);

    const newRow = [
      newId,
      carId,
      customerName,
      customerContact,
      startDate,
      returnDate,
      '', // daysLeft (formula-driven)
      '', // daysOut (formula-driven)
      dailyRate,
      '', // totalRentEarned (formula-driven)
      damageFee || '',
      lateFee || '',
      otherFee || '',
      additionalCostsDescription || '',
      '' // rentalStatus (formula-driven)
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGES.RENTALS,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow]
      }
    });

    res.status(201).json({
      id: newId,
      carId,
      customerName,
      customerContact,
      startDate,
      returnDate,
      dailyRate,
      damageFee,
      lateFee,
      otherFee,
      additionalCostsDescription,
      rentalStatus: 'Active'
    });
  } catch (error) {
    console.error('Error adding rental:', error);
    res.status(500).json({ error: 'Failed to add rental' });
  }
});

app.put('/api/rentals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGES.RENTALS
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    const currentRow = rows[rowIndex];
    const updatedRow = [
      id,
      updates.carId || currentRow[1],
      updates.customerName || currentRow[2],
      updates.customerContact || currentRow[3],
      updates.startDate || currentRow[4],
      updates.returnDate || currentRow[5],
      currentRow[6], // daysLeft (formula-driven)
      currentRow[7], // daysOut (formula-driven)
      Number(updates.dailyRate) || Number(currentRow[8]),
      currentRow[9], // totalRentEarned (formula-driven)
      Number(updates.damageFee) || Number(currentRow[10]),
      Number(updates.lateFee) || Number(currentRow[11]),
      Number(updates.otherFee) || Number(currentRow[12]),
      updates.additionalCostsDescription || currentRow[13],
      currentRow[14] // rentalStatus (formula-driven)
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Rentals!A${rowIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow]
      }
    });

    res.json({
      message: 'Rental updated successfully',
      data: updates
    });
  } catch (error) {
    console.error('Error updating rental:', error);
    res.status(500).json({ error: 'Failed to update rental' });
  }
});

// Dashboard endpoints
app.get('/api/dashboard', async (req, res) => {
  try {
    const [carsResponse, salesResponse, rentalsResponse, repairsResponse] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: RANGES.CARS }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: RANGES.SALES }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: RANGES.RENTALS }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: RANGES.REPAIRS })
    ]);

    const cars = carsResponse.data.values || [];
    const sales = salesResponse.data.values || [];
    const rentals = rentalsResponse.data.values || [];
    const repairs = repairsResponse.data.values || [];

    // Calculate total cars
    const totalCars = cars.length;

    // Calculate total revenue (from sales and rentals)
    const salesRevenue = sales.reduce((total, sale) => total + (Number(sale[3]) || 0), 0);
    const rentalRevenue = rentals.reduce((total, rental) => total + (Number(rental[9]) || 0), 0);
    const totalRevenue = salesRevenue + rentalRevenue;

    // Calculate active rentals
    const activeRentals = rentals.filter(rental => rental[14] === 'Active').length;

    // Calculate profit margin
    const totalCosts = cars.reduce((total, car) => total + (Number(car[15]) || 0), 0);
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;

    // Get monthly financial data
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      const monthStr = month.toLocaleString('default', { month: 'short' });
      
      const monthSales = sales.filter(sale => new Date(sale[2]).getMonth() === month.getMonth());
      const monthRentals = rentals.filter(rental => new Date(rental[4]).getMonth() === month.getMonth());
      const monthRepairs = repairs.filter(repair => new Date(repair[2]).getMonth() === month.getMonth());

      const revenue = monthSales.reduce((total, sale) => total + (Number(sale[3]) || 0), 0) +
                     monthRentals.reduce((total, rental) => total + (Number(rental[9]) || 0), 0);
      const expenses = monthRepairs.reduce((total, repair) => total + (Number(repair[4]) || 0), 0);
      const profit = revenue - expenses;

      return { month: monthStr, revenue, expenses, profit };
    }).reverse();

    // Get car status distribution
    const carStatusDistribution = {
      Available: cars.filter(car => car[8] === 'Available').length,
      Sold: cars.filter(car => car[8] === 'Sold').length,
      'On Rent': cars.filter(car => car[8] === 'On Rent').length
    };

    // Get recent sales data
    const recentSales = sales.slice(-5).map(sale => {
      const car = cars.find(car => car[0] === sale[1]);
      return {
        id: sale[0],
        carId: sale[1],
        make: car ? car[1] : '',
        model: car ? car[2] : '',
        salePrice: Number(sale[3]),
        profit: Number(sale[6])
      };
    });

    // Get top performing partners data
    const partnersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGES.PARTNERS
    });
    const partners = partnersResponse.data.values || [];
    const topPartners = partners.map(partner => ({
      name: partner[1],
      profit: Number(partner[3]) || 0
    })).sort((a, b) => b.profit - a.profit);

    // Get rental revenue trend
    const rentalRevenueTrend = monthlyData.map(data => ({
      month: data.month,
      revenue: rentals
        .filter(rental => new Date(rental[4]).toLocaleString('default', { month: 'short' }) === data.month)
        .reduce((total, rental) => total + (Number(rental[9]) || 0), 0)
    }));

    res.json({
      overview: {
        totalCars,
        totalRevenue,
        activeRentals,
        profitMargin
      },
      financialData: monthlyData,
      carStatusData: Object.entries(carStatusDistribution).map(([name, value]) => ({ name, value })),
      recentSales,
      topPartners,
      rentalRevenueTrend
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});