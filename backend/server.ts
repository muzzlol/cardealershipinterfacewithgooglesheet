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
  const limit = Math.min(Math.max(1, parseInt(query.limit as string) || 10), 1000); // Max 50 items per page
  return { page, limit };
};

const validateEnvironmentVariables = () => {
  const required = ['SPREADSHEET_ID'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Helper function for sheet operations
const getSheetRange = (range: string, startRow: number, endRow: number, columns: string) => {
  return `${range}!A${startRow}:${columns}${endRow}`;
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
app.use(cors());
app.use(express.json());

// Google Sheets Setup
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'keys.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});
const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

validateEnvironmentVariables();

// Updated Sheet ranges to include all necessary columns
const RANGES = {
  CARS: 'Cars!A2:V',        // 22 columns (A to V)
  REPAIRS: 'Repairs!A2:I',  // 9 columns (A to I)
  SALES: 'Sales!A2:J',      // 10 columns (A to J)
  PARTNERS: 'Partners!A2:E', // 5 columns (A to E)
  RENTALS: 'Rentals!A2:O',  // 15 columns (A to O)
};

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
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
      .filter(row => row[8] !== 'Available') 
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
        range : getSheetRange('Cars', startRow, endRow, 'V')
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `Cars!A:A`
      })
    ]);

    const totalItems = (countResponse.data.values?.length || 0) - 1;
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
      transportCost: Number(row[12]) || 0,
      inspectionCost: Number(row[13]) || 0,
      otherCost: Number(row[14]) || 0,
      totalCost: Number(row[15]),
      location: row[16],
      documents: row[17],
      photo: row[18],
      investmentSplit: row[19],
      profitLoss: Number(row[20] || 0),
      partnerReturns: row[21] || ''
    }));
    res.json(createPaginatedResponse(cars, page, limit, totalItems));
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
      otherCost,
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

    const newRow = [
      newId,
      make,
      model,
      year,
      color,
      registrationNumber,
      purchasePrice,
      purchaseDate,
      '', // currentStatus (formula-driven)
      condition,
      sellerName,
      sellerContact,
      transportCost || '',
      inspectionCost || '',
      otherCost || '',
      '', // totalCost (formula-driven)
      location || '',
      documentsUrl,
      photoUrl,
      investmentSplit || '',
      '', // profitLoss (formula-driven)
      ''  // partnerReturns (formula-driven)
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
      currentStatus: 'Available',
      condition,
      sellerName,
      sellerContact,
      transportCost,
      inspectionCost,
      otherCost,
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
app.put('/api/cars/:id', upload.fields([
  { name: 'documents', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

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

    // Handle file updates
    let documentsUrl = currentRow[17]; // Keep existing URL if no new file
    let photoUrl = currentRow[18];     // Keep existing URL if no new file

    if (files.documents) {
      // Delete old document if it exists
      if (documentsUrl) {
        await deleteFile(documentsUrl);
      }
      documentsUrl = await uploadFile(files.documents[0], documentsFolderId, 'document');
    }

    if (files.photo) {
      // Delete old photo if it exists
      if (photoUrl) {
        await deleteFile(photoUrl);
      }
      photoUrl = await uploadFile(files.photo[0], photosFolderId, 'photo');
    }

    const updatedRow = [
      id,
      updates.make || currentRow[1],
      updates.model || currentRow[2],
      updates.year || currentRow[3],
      updates.color || currentRow[4],
      updates.registrationNumber || currentRow[5],
      updates.purchasePrice || currentRow[6],
      updates.purchaseDate || currentRow[7],
      currentRow[8], // currentStatus (formula-driven)
      updates.condition || currentRow[9],
      updates.sellerName || currentRow[10],
      updates.sellerContact || currentRow[11],
      updates.transportCost || currentRow[12],
      updates.inspectionCost || currentRow[13],
      updates.otherCost || currentRow[14],
      currentRow[15], // totalCost (formula-driven)
      updates.location || currentRow[16],
      documentsUrl,
      photoUrl,
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
        documents: documentsUrl,
        photo: photoUrl
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
    const [response, currentResponse] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range : getSheetRange('Repairs', startRow, endRow, 'I')
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

    const totalItems = (currentResponse.data.values?.length || 0) - 1;
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
  const { page, limit } = validatePaginationParams(req.query);
  const startRow = (page - 1) * limit + 2;
  const endRow = startRow + limit - 1;
  try {
    const [response, countResponse] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: getSheetRange('Sales', startRow, endRow, 'J')
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
    const [carsResponse, repairsResponse, salesResponse] = await Promise.all([
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
    ]);

    // Safely get values with empty array fallback
    const cars = (carsResponse.data.values || []).filter(row => row.length >= 14);
    const repairs = (repairsResponse.data.values || []).filter(row => row.length >= 7);
    const sales = (salesResponse.data.values || []).filter(row => row.length >= 10);

    // Get the last 5 entries from each
    const recentCars = cars.slice(-5).map(row => {
      try {
        return {
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
          additionalCosts: row[12] ? JSON.parse(row[12]) : {},
          totalCost: parseFloat(row[13]) || 0,
        };
      } catch (error) {
        console.error('Error parsing car row:', error, row);
        return null;
      }
    }).filter(Boolean);

    const recentRepairs = repairs.slice(-5).map(row => {
      try {
        return {
          id: row[0],
          carId: row[1],
          repairDate: row[2],
          description: row[3],
          cost: parseFloat(row[4]) || 0,
          mechanicName: row[5],
          serviceProvider: {
            name: row[6] || '',
            contact: row[7] || '',
            address: row[8] || ''
          }
        };
      } catch (error) {
        console.error('Error parsing repair row:', error, row);
        return null;
      }
    }).filter(Boolean);

    const recentSales = sales.slice(-5).map(row => {
      try {
        return {
          id: row[0],
          carId: row[1],
          saleDate: row[2],
          salePrice: parseFloat(row[3]) || 0,
          buyerName: row[4],
          buyerContactInfo: row[5],
          profit: parseFloat(row[6]) || 0,
          paymentStatus: row[7],
          totalRepairCosts: parseFloat(row[8]) || 0,
          netProfit: parseFloat(row[9]) || 0,
        };
      } catch (error) {
        console.error('Error parsing sale row:', error, row);
        return null;
      }
    }).filter(Boolean);

    res.json({
      cars: recentCars,
      repairs: recentRepairs,
      sales: recentSales,
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
      range: 'Repairs!A2:G',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Repair not found' });
    }

    const updatedRow = [
      id,
      updates.carId,
      updates.repairDate,
      updates.description,
      updates.cost,
      updates.mechanicName,
      JSON.stringify(updates.serviceProvider),
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Repairs!A${rowIndex + 2}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [updatedRow],
      },
    });

    res.json({ message: 'Repair updated successfully', data: updates });
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
      range: 'Sales!A2:J',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const updatedRow = [
      id,
      updates.carId,
      updates.saleDate,
      updates.salePrice,
      updates.buyerName,
      updates.buyerContactInfo,
      updates.profit,
      updates.paymentStatus,
      updates.totalRepairCosts,
      updates.netProfit,
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Sales!A${rowIndex + 2}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [updatedRow],
      },
    });

    res.json({ message: 'Sale updated successfully', data: updates });
  } catch (error) {
    console.error('Error updating sale:', error);
    res.status(500).json({ error: 'Failed to update sale' });
  }
});

// Rental endpoints
app.get('/api/rentals', async (req, res) => {
  const { page, limit } = validatePaginationParams(req.query);
  const startRow = (page - 1) * limit + 2;
  const endRow = startRow + limit - 1;
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: getSheetRange('Rentals', startRow, endRow, 'N'),
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
      damageFee: Number(row[10]),
      lateFee: Number(row[11]),
      otherFee: Number(row[12]),
      additionalCostsDescription: row[13],
      rentalStatus: row[14]
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
      range: 'Rentals!A2:O',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    const updatedRow = [
      id,
      updates.carId,
      updates.customerName,
      updates.customerContact,
      updates.startDate,
      updates.returnDate,
      '', // daysLeft (formula-driven)
      '', // daysOut (formula-driven)
      updates.dailyRate,
      '', // totalRentEarned (formula-driven)
      updates.damageFee || '',
      updates.lateFee || '',
      updates.otherFee || '',
      updates.additionalCostsDescription || '',
      '' // rentalStatus (formula-driven)
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Rentals!A${rowIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow],
      },
    });

    res.json({ message: 'Rental updated successfully', data: updates });
  } catch (error) {
    console.error('Error updating rental:', error);
    res.status(500).json({ error: 'Failed to update rental' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});