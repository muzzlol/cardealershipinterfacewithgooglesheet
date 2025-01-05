import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Car as CarIcon, Loader2 } from 'lucide-react';
import { Car } from '@/types';
import { apiClient } from '@/lib/api-client';
import { CarActions } from './car-actions';
import { useToast } from '@/components/ui/use-toast';
import { PageContainer } from '@/components/layout/page-container';
import { ScrollArea } from '@/components/ui/scroll-area';

export function CarsList() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCars();
  }, []);

  async function loadCars() {
    try {
      setLoading(true);
      const data = await apiClient.getCars();
      setCars(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load cars',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }
  if (loading) {
    return (
      <PageContainer>
        <div className="flex h-[200px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Cars Inventory</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Manage your vehicle inventory
            </p>
          </div>
          <Link to="add">
            <Button className="sm:w-auto w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Car
            </Button>
          </Link>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px]">Car ID</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No cars found.
                  </TableCell>
                </TableRow>
              ) : (
                cars.map((car) => (
                  <TableRow key={car.id}>
                    <TableCell className="font-medium">{car.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-secondary p-2">
                          <CarIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{car.make} {car.model}</div>
                          <div className="text-sm text-muted-foreground">
                            {car.color}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{car.year}</TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        car.currentStatus === 'Available' 
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {car.currentStatus}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {car.purchasePrice.toLocaleString()} SAR
                    </TableCell>
                    <TableCell>
                      {car.purchaseDate.toString()}
                    </TableCell>
                    <TableCell>
                      {car.condition}
                    </TableCell>
                    <TableCell>
                      <CarActions car={car} onRefresh={loadCars} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageContainer>
  );
}