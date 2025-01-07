import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/use-toast';
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
import { Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';

const formSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  color: z.string().min(1, 'Color is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  purchasePrice: z.number().positive('Price must be positive'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  currentStatus: z.enum(['Available', 'Sold']).refine(value => value === 'Available' || value === 'Sold', {
    message: 'Current status must be "Available" or "Sold"',
  }),
  condition: z.string().min(1, 'Condition is required'),
  sellerName: z.string().min(1, 'Seller name is required'),
  sellerContact: z.string().min(1, 'Seller contact is required'),
  transportCost: z.number().optional(),
  inspectionCost: z.number().optional(),
  otherCost: z.number().optional()
});

export function AddCar() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      purchaseDate: new Date().toISOString().split('T')[0],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      const totalAdditionalCosts = 
        (values.transportCost || 0) + 
        (values.inspectionCost || 0) + 
        (values.otherCost || 0);
        
      await apiClient.addCar({
        make: values.make,
        model: values.model,
        year: values.year,
        color: values.color,
        registrationNumber: values.registrationNumber,
        purchasePrice: values.purchasePrice,
        purchaseDate: values.purchaseDate,
        currentStatus: values.currentStatus,
        condition: values.condition,
        sellerName: values.sellerName,
        sellerContact: values.sellerContact,
        additionalCosts: {
          transport: values.transportCost || 0,
          inspection: values.inspectionCost || 0,
          other: values.otherCost || 0
        },
        totalCost: values.purchasePrice + totalAdditionalCosts
      });

      toast({
        title: 'Success',
        description: 'Car has been added successfully.',
      });

      navigate('/cars');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add car. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Add Car</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Add a new car to the inventory
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-semibold">Vehicle Information</h2>
                  <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="make"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Make</FormLabel>
                          <FormControl>
                            <Input placeholder="Toyota" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model</FormLabel>
                          <FormControl>
                            <Input placeholder="Camry" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="2024" 
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <FormControl>
                            <Input placeholder="Silver" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="registrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration Number</FormLabel>
                          <FormControl>
                            <Input placeholder="ABC123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold">Purchase Information</h2>
                  <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="purchasePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="50000" 
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="purchaseDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currentStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Available">Available</SelectItem>
                              <SelectItem value="Sold">Sold</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condition</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select condition" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="New">New</SelectItem>
                              <SelectItem value="Used">Used</SelectItem>
                              <SelectItem value="Certified Pre-Owned">Certified Pre-Owned</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold">Additional Costs</h2>
                  <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="transportCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transport Cost</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter transport cost" 
                              {...field} 
                              onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="inspectionCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inspection Cost</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter inspection cost" 
                              {...field}
                              onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="otherCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other Costs</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter other costs" 
                              {...field}
                              onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold">Seller Information</h2>
                  <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="sellerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Seller Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter seller name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sellerContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Seller Contact</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter seller contact" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => navigate('/cars')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="min-w-[120px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Car'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </PageContainer>
  );
}
