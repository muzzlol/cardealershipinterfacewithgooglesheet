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
}

export interface Repair {
  id: string;
  carId: string;
  repairDate: string;
  description: string;
  cost: number;
  mechanicName: string;
}

export interface Sale {
  id: string;
  carId: string;
  saleDate: string;
  salePrice: number;
  buyerName: string;
  buyerContactInfo: string; //email ya number
  profit: number;
  paymentStatus: 'Paid' | 'Pending';
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

