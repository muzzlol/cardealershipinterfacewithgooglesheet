const API_BASE_URL = 'http://localhost:3000/api';
import { Sale, Repair, Partner, Rental } from '@/types';

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  }
}

interface GroupedRepairs {
  carId: string;
  totalCost: number;
  repairs: Repair[];
}

interface Car {
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
  location?: string;
  sellerName: string;
  sellerContact: string;
  transportCost: number;
  inspectionCost: number;
  otherCost: number;
  totalCost: number;
  documents?: string;
  photo?: string;
  investmentSplit: string;
  profitLoss: number;
  partnerReturns: string;
}

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'api request failed');
    }

    return response.json();
  }

  // Cars
  async getAvailableCars(): Promise<Car[]> {
    return this.request('/cars/available');
  }

  async getCars(page: number, limit: number): Promise<PaginatedResponse<Car>> {
    return this.request<PaginatedResponse<Car>>(`/cars?page=${page}&limit=${limit}`);
  }

  async addCar(carData: FormData): Promise<Car> {
    return this.request<Car>('/cars', {
      method: 'POST',
      body: carData, // FormData will automatically set the correct Content-Type
    });
  }

  async updateCar(id: string, carData: FormData): Promise<Car> {
    return this.request<Car>(`/cars/${id}`, {
      method: 'PUT',
      body: carData,
    });
  }

  // Sales
  async getSales(page: number, limit: number): Promise<PaginatedResponse<Sale>> {
    return this.request<PaginatedResponse<Sale>>(`/sales?page=${page}&limit=${limit}`);
  }

  async addSale(sale: Omit<Sale, 'id' | 'profit' | 'totalRepairCosts' | 'netProfit'>): Promise<Sale> {
    return this.request<Sale>('/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sale),
    });
  }

  async updateSale(id: string, sale: Partial<Sale>): Promise<Sale> {
    return this.request<Sale>(`/sales/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sale),
    });
  }

  // Repairs
  async getRepairs(page: number, limit: number): Promise<PaginatedResponse<Repair>> {
    return this.request<PaginatedResponse<Repair>>(`/repairs?page=${page}&limit=${limit}`);
  }

  async getRepairsByCarId(carId: string): Promise<Repair[]> {
    return this.request<Repair[]>(`/repairs?carId=${carId}`);
  }

  async addRepair(repair: Omit<Repair, 'id'>): Promise<Repair> {
    return this.request<Repair>('/repairs', {
      method: 'POST',
      body: JSON.stringify(repair),
    });
  }

  async updateRepair(id: string, repair: Partial<Repair>): Promise<Repair> {
    return this.request<Repair>(`/repairs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(repair),
    });
  }

  async getRepairsGroupedByCar(page: number, limit: number): Promise<PaginatedResponse<GroupedRepairs>> {
    const response = await this.request<PaginatedResponse<Repair>>(`/repairs?page=${page}&limit=${limit}`);
    
    // Group repairs by carId
    const groupedRepairs = Object.values(
      response.data.reduce<Record<string, GroupedRepairs>>((acc, repair) => {
        if (!acc[repair.carId]) {
          acc[repair.carId] = {
            carId: repair.carId,
            totalCost: 0,
            repairs: []
          };
        }
        acc[repair.carId].repairs.push(repair);
        acc[repair.carId].totalCost += repair.cost;
        return acc;
      }, {})
    );

    return {
      data: groupedRepairs,
      pagination: response.pagination
    };
  }

  // Rentals
  async getRentals(page: number, limit: number): Promise<PaginatedResponse<Rental>> {
    return this.request<PaginatedResponse<Rental>>(`/rentals?page=${page}&limit=${limit}`);
  }

  async addRental(rental: Omit<Rental, 'id' | 'daysLeft' | 'daysOut' | 'totalRentEarned' | 'rentalStatus'>): Promise<Rental> {
    return this.request<Rental>('/rentals', {
      method: 'POST',
      body: JSON.stringify(rental),
    });
  }

  async updateRental(id: string, rental: Partial<Rental>): Promise<Rental> {
    return this.request<Rental>(`/rentals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rental),
    });
  }

  // Partners
  async getPartners(): Promise<Partner[]> {
    return this.request<Partner[]>('/partners');
  }

  // Recent Entries
  async getRecentEntries(): Promise<{
    cars: Car[];
    repairs: Repair[];
    sales: Sale[];
  }> {
    return this.request('/recent-entries');
  }
}

export const apiClient = new ApiClient();