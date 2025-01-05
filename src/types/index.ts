export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  registrationNumber: string;
  purchasePrice: number;
  purchaseDate: string;
  currentStatus: 'Available' | 'Sold';
  condition: string;
  sellerName: string;
  sellerContact: string;
  additionalCosts: {
    transport?: number;
    inspection?: number;
    other?: number;
  };
  totalCost: number; // purchasePrice + all additional costs
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
  paymentStatus: 'Paid' | 'Pending' | 'Unpaid';
  totalRepairCosts: number;
  netProfit: number; // salePrice - totalCost - totalRepairCosts
}

export interface Partner {
  id: string;
  name: string;
  sharePercentage: number;
  contactInfo: string;
  netProfit: number;
  profitEarnedOverTime: number;
  role: string;
}
