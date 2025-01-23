import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { PageContainer } from '@/components/layout/page-container';
import { apiClient } from '@/lib/api-client';
import { Car } from '@/types';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  carId: z.string().min(1, 'Car is required'),
  saleDate: z.string().min(1, 'Sale date is required'),
  salePrice: z.number().min(1, 'Sale price is required'),
  buyerName: z.string().min(1, 'Buyer name is required'),
  buyerContactInfo: z.string().min(1, 'Buyer contact info is required'),
  paymentStatus: z.enum(['Paid', 'Unpaid'], {
    required_error: 'Payment status is required',
  }),
});

export function AddSale() {
  const [loading, setLoading] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const [selectedCarDetails, setSelectedCarDetails] = useState<{
    totalCost: number;
    totalRepairCosts: number;
    estimatedProfit: number;
  } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      saleDate: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    loadAvailableCars();
  }, []);

  const loadAvailableCars = async () => {
    try {
      const availableCars = await apiClient.getAvailableCars();
      const filteredCars = availableCars.filter(car => car.currentStatus === 'Available');
      setCars(filteredCars);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load available cars',
        variant: 'destructive',
      });
    } finally {
      setLoadingCars(false);
    }
  };

  const onCarChange = async (carId: string) => {
    try {
      const car = cars.find(c => c.id === carId);
      if (!car) return;

      const repairs = await apiClient.getRepairsByCarId(carId);
      const totalRepairCosts = repairs.reduce((sum, repair) => sum + repair.cost, 0);
      const salePrice = Number(form.getValues('salePrice')) || 0;
      
      setSelectedCarDetails({
        totalCost: car.totalCost,
        totalRepairCosts,
        estimatedProfit: salePrice - car.totalCost - totalRepairCosts
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load car details',
        variant: 'destructive',
      });
    }
  };

  const onSalePriceChange = (price: number) => {
    if (selectedCarDetails) {
      setSelectedCarDetails({
        ...selectedCarDetails,
        estimatedProfit: price - selectedCarDetails.totalCost - selectedCarDetails.totalRepairCosts
      });
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      await apiClient.addSale({
        carId: values.carId,
        saleDate: values.saleDate,
        salePrice: Number(values.salePrice),
        buyerName: values.buyerName,
        buyerContactInfo: values.buyerContactInfo,
        paymentStatus: values.paymentStatus
      });

      toast({
        title: 'Success',
        description: 'Sale has been recorded successfully.',
      });

      navigate('/sales');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record sale. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  if (loadingCars) {
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Record Sale</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Record a new car sale
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="carId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Car</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        onCarChange(value);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a car" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cars.map(car => (
                          <SelectItem key={car.id} value={car.id}>
                            {car.year} {car.make} {car.model} - {car.registrationNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="saleDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Price (SAR)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter sale price" 
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value ? Number(e.target.value) : 0;
                          field.onChange(value);
                          onSalePriceChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="buyerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buyer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="buyerContactInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buyer Contact Info</FormLabel>
                    <FormControl>
                      <Input placeholder="Email or Phone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Paid">Paid</SelectItem>
                          <SelectItem value="Unpaid">Unpaid</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedCarDetails && (
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <h3 className="font-semibold">Profit Calculation</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Total Cost:</div>
                    <div>₹{selectedCarDetails.totalCost.toLocaleString()}</div>
                    
                    <div>Total Repair Costs:</div>
                    <div>₹{selectedCarDetails.totalRepairCosts.toLocaleString()}</div>
                    
                    <div>Estimated Net Profit:</div>
                    <div className={selectedCarDetails.estimatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ₹{selectedCarDetails.estimatedProfit.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/sales')}
                  className="sm:w-auto w-full"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="sm:w-auto w-full">
                  {loading ? 'Recording...' : 'Record Sale'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </PageContainer>
  );
}
