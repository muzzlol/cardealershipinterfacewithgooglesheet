export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  registrationNumber: string;
  purchasePrice: number;
  purchaseDate: string;
  currentStatus: 'Available' | 'Sold' | 'On Rent';
  condition: string;
  sellerName: string;
  sellerContact: string;
  transportCost: number;
  inspectionCost: number;
  otherCost: number;
  totalCost: number;
  location?: string;
  documents?: string;
  photo?: string;
  investmentSplit: string;
  profitLoss: number;
  partnerReturns: string;
}

export interface Repair {
  id: string;
  carId: string;
  repairDate: string;
  description: string;
  cost: number;
  mechanicName: string;
  serviceProvider: {
    name: string;
    contact: string;
    address: string;
  };
}

export interface Sale {
  id: string;
  carId: string;
  saleDate: string;
  salePrice: number;
  buyerName: string;
  buyerContactInfo: string; //email ya number
  profit: number;
  paymentStatus: 'Paid' | 'Unpaid';
  totalRepairCosts: number;
  netProfit: number;
}

export interface Partner {
  id: string;
  name: string;
  contactInfo: string;
  netProfit: number;
  role: string;
}

export interface Rental {
  id: string;
  carId: string;
  customerName: string;
  customerContact: string;
  startDate: string;
  returnDate: string;
  daysLeft: number;
  daysOut: number;
  dailyRate: number;
  totalRentEarned: number;
  damageFee: number;
  lateFee: number;
  otherFee: number;
  additionalCostsDescription: string;
  rentalStatus: 'Active' | 'Completed';
}