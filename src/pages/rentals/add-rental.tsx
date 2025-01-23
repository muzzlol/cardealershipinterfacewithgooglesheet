import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { Car } from '@/types';
import { apiClient } from '@/lib/api-client';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { PageContainer } from '@/components/layout/page-container';

interface ExistingRental {
  startDate: Date;
  returnDate: Date;
}

interface CarWithRentals extends Car {
  existingRentals: ExistingRental[];
}

const formSchema = z.object({
  carId: z.string().min(1, 'Car is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerContact: z.string().min(1, 'Contact information is required'),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  returnDate: z.date({
    required_error: 'Return date is required',
  }),
  dailyRate: z.number().min(1, 'Daily rate must be greater than 0'),
});

export function AddRental() {
  const [loading, setLoading] = useState(false);
  const [availableCars, setAvailableCars] = useState<CarWithRentals[]>([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dailyRate: 0,
    },
  });

  useEffect(() => {
    loadAvailableCars();
  }, []);

  const loadAvailableCars = async () => {
    try {
      const cars = await apiClient.getAvailableCars(); // get all cars that are not sold i.e available and on rent
      // Get rentals for each car that's on rent
      const carsWithRentals = await Promise.all(
        cars.map(async (car) => {
          if (car.currentStatus === 'On Rent') {
            const rentals = await apiClient.getRentals(1, 100); // Get all rentals
            const carRentals = rentals.data
              .filter(rental => rental.carId === car.id && rental.rentalStatus === 'Active')
              .map(rental => ({
                startDate: parseISO(rental.startDate),
                returnDate: parseISO(rental.returnDate),
              }));
            return { ...car, existingRentals: carRentals };
          }
          return { ...car, existingRentals: [] };
        })
      );
      setAvailableCars(carsWithRentals);
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

  const isDateRangeAvailable = (startDate: Date, returnDate: Date, carId: string) => {
    const car = availableCars.find(c => c.id === carId);
    if (!car) return true;

    return !car.existingRentals.some(rental =>
      isWithinInterval(startDate, { start: rental.startDate, end: rental.returnDate }) ||
      isWithinInterval(returnDate, { start: rental.startDate, end: rental.returnDate }) ||
      (startDate <= rental.startDate && returnDate >= rental.returnDate)
    );
  };

  const getUnavailableDates = (carId: string): Date[] => {
    const car = availableCars.find(c => c.id === carId);
    if (!car) return [];

    const unavailableDates: Date[] = [];
    car.existingRentals.forEach(rental => {
      let currentDate = new Date(rental.startDate);
      while (currentDate <= rental.returnDate) {
        unavailableDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    return unavailableDates;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!isDateRangeAvailable(values.startDate, values.returnDate, values.carId)) {
      toast({
        title: 'Error',
        description: 'Selected date range overlaps with existing rentals',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await apiClient.addRental({
        ...values,
        startDate: format(values.startDate, 'yyyy-MM-dd'),
        returnDate: format(values.returnDate, 'yyyy-MM-dd'),
        damageFee: 0,
        lateFee: 0,
        otherFee: 0,
        additionalCostsDescription: ''
      });
      toast({
        title: 'Success',
        description: 'Rental added successfully',
      });
      navigate('/rentals');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add rental',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCarId = form.watch('carId');
  const selectedCar = availableCars.find(car => car.id === selectedCarId);

  return (
    <PageContainer>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Add Rental</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Create a new rental record
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
                      disabled={loadingCars}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a car" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCars.map((car) => (
                          <SelectItem key={car.id} value={car.id}>
                            {car.make} {car.model} ({car.year}) - {car.currentStatus}
                            {car.existingRentals.length > 0 && ' (Has existing rentals)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedCar && selectedCar.existingRentals.length > 0 && (
                <div className="rounded-lg border p-4 bg-muted/50">
                  <h3 className="font-medium mb-2">Existing Rental Periods:</h3>
                  <ul className="space-y-1 text-sm">
                    {selectedCar.existingRentals.map((rental, index) => (
                      <li key={index} className="text-muted-foreground">
                        {format(rental.startDate, 'MMM d, yyyy')} - {format(rental.returnDate, 'MMM d, yyyy')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter customer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Information</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contact information" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date() || // Can't select past dates
                              (selectedCarId ? getUnavailableDates(selectedCarId).some(
                                unavailable => unavailable.toDateString() === date.toDateString()
                              ) : false)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="returnDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Return Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < (form.getValues('startDate') || new Date()) || // Can't select dates before start date
                              (selectedCarId ? getUnavailableDates(selectedCarId).some(
                                unavailable => unavailable.toDateString() === date.toDateString()
                              ) : false)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="dailyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Rate (SAR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter daily rate"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/rentals')}
                  className="sm:w-auto w-full"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="sm:w-auto w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Rental
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </PageContainer>
  );
}
