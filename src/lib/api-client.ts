const API_BASE_URL = 'http://localhost:3000/api';
import { Car, Sale, Repair, Partner } from '@/types';

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  }
}

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
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

  async getCars(page : number, limit : number): Promise<PaginatedResponse<Car>> {
    return this.request<PaginatedResponse<Car>>(`/cars?page=${page}&limit=${limit}`);
  }

  async addCar(car: Omit<Car, 'id'>): Promise<Car> {
    return this.request<Car>('/cars', {
      method: 'POST',
      body: JSON.stringify(car),
    });
  }

  // Sales
  async getSales(page: number, limit: number): Promise<PaginatedResponse<Sale>> {
    return this.request<PaginatedResponse<Sale>>(`/sales?page=${page}&limit=${limit}`);
  }

  async addSale(sale: Omit<Sale, 'id' | 'profit'>): Promise<Sale> {
    return this.request<Sale>('/sales', {
      method: 'POST',
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

  // Partners
  async getPartners(): Promise<Partner[]> {
    return this.request<Partner[]>('/partners');
  }

  // Dashboard
  async getDashboard(): Promise<{
    totalCars: number;
    availableCars: number;
    totalProfit: number;
    recentRepairs: Repair[];
    recentSales: Sale[];
  }> {
    return this.request('/dashboard');
  }
}

export const apiClient = new ApiClient();
