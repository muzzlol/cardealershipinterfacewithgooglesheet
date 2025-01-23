const API_BASE_URL = 'http://localhost:3000/api';

import { 
  Car, Repair, Sale, Partner, Rental,
  CarInput, RepairInput, SaleInput, RentalInput, PartnerInput,
  CarUpdate, RepairUpdate, SaleUpdate, RentalUpdate, PartnerUpdate
} from '@/types';

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

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
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
      body: carData,
      headers: {} // Let browser set correct Content-Type for FormData
    });
  }

  async updateCar(id: string, carData: FormData): Promise<Car> {
    return this.request<Car>(`/cars/${id}`, {
      method: 'PUT',
      body: carData,
      headers: {} // Let browser set correct Content-Type for FormData
    });
  }

  // Sales
  async getSales(page: number, limit: number): Promise<PaginatedResponse<Sale>> {
    return this.request<PaginatedResponse<Sale>>(`/sales?page=${page}&limit=${limit}`);
  }

  async addSale(sale: SaleInput): Promise<Sale> {
    return this.request<Sale>('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
  }

  async updateSale(id: string, sale: Partial<SaleInput>): Promise<Sale> {
    return this.request<Sale>(`/sales/${id}`, {
      method: 'PUT',
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

  async addRepair(repair: RepairInput): Promise<Repair> {
    return this.request<Repair>('/repairs', {
      method: 'POST',
      body: JSON.stringify(repair),
    });
  }

  async updateRepair(id: string, repair: Partial<RepairInput>): Promise<Repair> {
    return this.request<Repair>(`/repairs/${id}`, {
      method: 'PUT',
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

  async addRental(rental: RentalInput): Promise<Rental> {
    return this.request<Rental>('/rentals', {
      method: 'POST',
      body: JSON.stringify(rental),
    });
  }

  async updateRental(id: string, rental: Partial<RentalInput>): Promise<Rental> {
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
    rentals: Rental[];
  }> {
    return this.request('/recent-entries');
  }

  // Dashboard Data
  async getDashboardData(): Promise<{
    overview: {
      totalCars: number;
      totalRevenue: number;
      activeRentals: number;
      profitMargin: number;
    };
    financialData: Array<{
      month: string;
      revenue: number;
      expenses: number;
      profit: number;
    }>;
    carStatusData: Array<{
      name: string;
      value: number;
    }>;
    recentSales: Array<{
      id: string;
      carId: string;
      make: string;
      model: string;
      salePrice: number;
      profit: number;
    }>;
    topPartners: Array<{
      name: string;
      profit: number;
    }>;
    rentalRevenueTrend: Array<{
      month: string;
      revenue: number;
    }>;
  }> {
    return this.request('/dashboard');
  }
}

export const apiClient = new ApiClient();