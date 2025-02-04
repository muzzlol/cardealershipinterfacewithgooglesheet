// Common types
export type Status = 'Available' | 'Sold' | 'On Rent';
export type Condition = 'Excellent' | 'Good' | 'Fair' | 'Poor';
export type PaymentStatus = 'Paid' | 'Unpaid';
export type RentalStatus = 'Active' | 'Completed';

// Base interfaces with computed fields marked as readonly
export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  registrationNumber: string;
  purchasePrice: number;
  purchaseDate: string;
  currentStatus: Status;
  condition: Condition;
  sellerName: string;
  sellerContact: string;
  transportCost: number;
  inspectionCost: number;
  otherCosts: number;
  readonly totalCost: number;
  location?: string;
  documents?: string;
  photo?: string;
  investmentSplit: string;
  readonly profitLoss: number;
  readonly partnerReturns: string;
}

export interface Repair {
  id: string;
  carId: string;
  repairDate: string;
  description: string;
  cost: number;
  mechanicName: string;
  serviceProviderName: string;
  serviceProviderContact: string;
  serviceProviderAddress: string;
}

export interface Sale {
  id: string;
  carId: string;
  saleDate: string;
  salePrice: number;
  buyerName: string;
  buyerContactInfo: string;
  readonly profit: number;
  paymentStatus: PaymentStatus;
  readonly totalRepairCosts: number;
  readonly netProfit: number;
}

export interface Partner {
  id: string;
  name: string;
  contactInfo: string;
  readonly netProfit: number;
  role: string;
}

export interface Rental {
  id: string;
  carId: string;
  customerName: string;
  customerContact: string;
  startDate: string;
  returnDate: string;
  readonly daysLeft: number;
  readonly daysOut: number;
  dailyRate: number;
  readonly totalRentEarned: number;
  damageFee: number;
  lateFee: number;
  otherFee: number;
  additionalCostsDescription: string;
  readonly rentalStatus: RentalStatus;
}

// Input types for creating/updating records
export type CarInput = Omit<Car, 'id' | 'totalCost' | 'profitLoss' | 'partnerReturns' | 'currentStatus'>;
export type RepairInput = Omit<Repair, 'id'>;
export type SaleInput = Omit<Sale, 'id' | 'profit' | 'totalRepairCosts' | 'netProfit'>;
export type RentalInput = Omit<Rental, 'id' | 'daysLeft' | 'daysOut' | 'totalRentEarned' | 'rentalStatus'>;
export type PartnerInput = Omit<Partner, 'id' | 'netProfit'>;

// Update types (all fields optional except id)
export type CarUpdate = Partial<CarInput> & { id: string };
export type RepairUpdate = Partial<RepairInput> & { id: string };
export type SaleUpdate = Partial<SaleInput> & { id: string };
export type RentalUpdate = Partial<RentalInput> & { id: string };
export type PartnerUpdate = Partial<PartnerInput> & { id: string };