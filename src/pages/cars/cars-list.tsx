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
// import { ScrollArea } from '@/components/ui/scroll-area';

export function CarsList() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCars();
  }, []);

  // Refresh list when window regains focus (user returns from edit page)
  useEffect(() => {
    function onFocus() {
      loadCars();
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  return (
    <div className="w-full py-8 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Cars Inventory</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Manage your vehicle inventory
            </p>
          </div>
          <Link to="add">
            <Button>
              <Plus className="mr-4 h-4 w-4" />
              Add Car
            </Button>
          </Link>
        </div>

        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px]">Car ID</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Purchase Price</TableHead>
                <TableHead>Additional Costs</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Seller Info</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center">
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
                          <div className="text-sm text-muted-foreground">{car.color}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{car.year}</TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        car.currentStatus === 'Available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {car.currentStatus}
                      </div>
                    </TableCell>
                    <TableCell>${car.purchasePrice.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Transport: ${car.additionalCosts.transport?.toLocaleString() ?? '0'}</div>
                        <div>Inspection: ${car.additionalCosts.inspection?.toLocaleString() ?? '0'}</div>
                        <div>Other: ${car.additionalCosts.other?.toLocaleString() ?? '0'}</div>
                      </div>
                    </TableCell>
                    <TableCell>${car.totalCost.toLocaleString()}</TableCell>
                    <TableCell>{new Date(car.purchaseDate).toLocaleDateString()}</TableCell>
                    <TableCell>{car.condition}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{car.sellerName}</div>
                        <div className="text-muted-foreground">{car.sellerContact}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <CarActions car={car} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
    </div>
  );
}