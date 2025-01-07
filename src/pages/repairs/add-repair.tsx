import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
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
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  carId: z.string().min(1, 'Car is required'),
  description: z.string().min(1, 'Description is required'),
  cost: z.number().positive('Cost must be positive'),
  mechanicName: z.string().min(1, 'Mechanic name is required'),
  repairDate: z.string().min(1, 'Date is required'),
  serviceProvider: z.object({
    name: z.string().min(1, 'Service provider name is required'),
    contact: z.string().min(1, 'Service provider contact is required'),
    address: z.string().min(1, 'Service provider address is required')
  })
});

export function AddRepair() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      repairDate: new Date().toISOString().split('T')[0],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      await apiClient.addRepair({
        ...values,
        serviceProvider: {
          name: values.serviceProvider.name,
          contact: values.serviceProvider.contact,
          address: values.serviceProvider.address
        }
      });

      toast({
        title: 'Success',
        description: 'Repair has been recorded successfully.',
      });
      navigate('/repairs');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record repair. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Add Repair</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Record a new repair or maintenance
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-semibold">Repair Details</h2>
                  <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="carId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Car</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a car" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="C001">Toyota Camry (2020)</SelectItem>
                              <SelectItem value="C002">Honda Accord (2021)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="repairDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Repair Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the repairs or maintenance performed"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost (SAR)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mechanicName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mechanic</FormLabel>
                          <FormControl>
                            <Input placeholder="Mechanic name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="serviceProvider.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Provider Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter service provider name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="serviceProvider.contact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Provider Contact</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter service provider contact" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="serviceProvider.address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Provider Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter service provider address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/repairs')}
                  className="sm:w-auto w-full"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="sm:w-auto w-full">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Record Repair'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </PageContainer>
  );
}
