import { useState, useEffect } from 'react';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Percent, Upload, FileText, Image as ImageIcon } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';

const formSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  color: z.string().min(1, 'Color is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  purchasePrice: z.number().positive('Price must be positive'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  condition: z.string().min(1, 'Condition is required'),
  location: z.string().optional(),
  sellerName: z.string().min(1, 'Seller name is required'),
  sellerContact: z.string().min(1, 'Seller contact is required'),
  transportCost: z.number().optional(),
  inspectionCost: z.number().optional(),
  otherCost: z.number().optional(),
  azamPercentage: z.number().min(0).max(100),
  imranPercentage: z.number().min(0).max(100),
  aliPercentage: z.number().min(0).max(100),
  documents: z.instanceof(File).optional(),
  photo: z.instanceof(File).optional(),
}).refine(data => {
  const total = (data.azamPercentage || 0) + (data.imranPercentage || 0) + (data.aliPercentage || 0);
  return Math.abs(total - 100) < 0.0001;
}, {
  message: "Investment percentages must total 100%",
  path: ["azamPercentage"]
});

export function AddCar() {
  const [loading, setLoading] = useState(false);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      purchaseDate: new Date().toISOString().split('T')[0],
      azamPercentage: 33.33,
      imranPercentage: 33.33,
      aliPercentage: 33.34,
    },
  });

  // Calculate total cost
  const purchasePrice = form.watch('purchasePrice') || 0;
  const transportCost = form.watch('transportCost') || 0;
  const inspectionCost = form.watch('inspectionCost') || 0;
  const otherCost = form.watch('otherCost') || 0;
  const totalCost = purchasePrice + transportCost + inspectionCost + otherCost;

  // Watch percentage values
  const azamPercentage = form.watch('azamPercentage') || 0;
  const imranPercentage = form.watch('imranPercentage') || 0;
  const aliPercentage = form.watch('aliPercentage') || 0;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      const formData = new FormData();
      
      // Add basic fields
      formData.append('make', values.make);
      formData.append('model', values.model);
      formData.append('year', values.year.toString());
      formData.append('color', values.color);
      formData.append('registrationNumber', values.registrationNumber);
      formData.append('purchasePrice', values.purchasePrice.toString());
      formData.append('purchaseDate', values.purchaseDate);
      formData.append('condition', values.condition);
      formData.append('location', values.location || '');
      formData.append('sellerName', values.sellerName);
      formData.append('sellerContact', values.sellerContact);
      formData.append('transportCost', values.transportCost?.toString() || '0');
      formData.append('inspectionCost', values.inspectionCost?.toString() || '0');
      formData.append('otherCost', values.otherCost?.toString() || '0');

      // Format investment split as comma-separated string with 2 decimal places
      const investmentSplit = [
        (values.azamPercentage / 100).toFixed(2),
        (values.imranPercentage / 100).toFixed(2),
        (values.aliPercentage / 100).toFixed(2)
      ].join(',');
      formData.append('investmentSplit', investmentSplit);

      // Add files if they exist
      if (values.documents) {
        formData.append('documents', values.documents);
      }
      if (values.photo) {
        formData.append('photo', values.photo);
      }

      try {
        const response = await apiClient.addCar(formData);
        console.log('API Response:', response);
        
        toast({
          title: 'Success',
          description: 'Car has been added successfully.',
        });

        navigate('/cars');
      } catch (apiError: any) {
        console.error('API Error:', apiError);
        console.error('API Error details:', apiError.message);
        
        toast({
          title: 'Error',
          description: apiError.message || 'Failed to add car. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      console.error('Error stack:', error.stack);
      
      toast({
        title: 'Error',
        description: 'Failed to process form data. Please check your inputs.',
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
                              <SelectItem value="Like New">Like New</SelectItem>
                              <SelectItem value="Excellent">Excellent</SelectItem>
                              <SelectItem value="Good">Good</SelectItem>
                              <SelectItem value="Fair">Fair</SelectItem>
                              <SelectItem value="Poor">Poor</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Google Maps URL" 
                              {...field} 
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional: Add Google Maps location URL
                          </FormDescription>
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
                              onChange={e => field.onChange(parseInt(e.target.value))}
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
                              onChange={e => field.onChange(parseInt(e.target.value))}
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
                              onChange={e => field.onChange(parseInt(e.target.value))}
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

                <div>
                  <h2 className="text-lg font-semibold">Investment Split</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Total Investment: SAR {totalCost.toLocaleString()}
                  </p>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="azamPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Azam's Share</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type="number" 
                                step="0.01"
                                {...field}
                                onChange={e => {
                                  const newValue = parseFloat(e.target.value);
                                  field.onChange(newValue);
                                }}
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <Percent className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription className="text-right">
                            SAR {((azamPercentage / 100) * totalCost).toLocaleString()}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="imranPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Imran's Share</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type="number" 
                                step="0.01"
                                {...field}
                                onChange={e => {
                                  const newValue = parseFloat(e.target.value);
                                  field.onChange(newValue);
                                }}
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <Percent className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription className="text-right">
                            SAR {((imranPercentage / 100) * totalCost).toLocaleString()}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="aliPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ali's Share</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type="number" 
                                step="0.01"
                                {...field}
                                onChange={e => {
                                  const newValue = parseFloat(e.target.value);
                                  field.onChange(newValue);
                                }}
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <Percent className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription className="text-right">
                            SAR {((aliPercentage / 100) * totalCost).toLocaleString()}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-2 text-sm text-muted-foreground text-right">
                    Total: {(azamPercentage + imranPercentage + aliPercentage).toFixed(2)}%
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold">Files</h2>
                  <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="documents"
                      render={({ field: { onChange, value, ...field } }) => (
                        <FormItem>
                          <FormLabel>Documents</FormLabel>
                          <FormControl>
                            <div className="flex flex-col gap-4">
                              <div 
                                className={`
                                  border-2 border-dashed rounded-lg p-6 
                                  ${documentPreview ? 'border-muted' : 'border-muted-foreground/25'}
                                  hover:border-muted-foreground/50 transition-colors
                                  flex flex-col items-center justify-center gap-2
                                  cursor-pointer
                                `}
                                onClick={() => document.getElementById('document-upload')?.click()}
                              >
                                {documentPreview ? (
                                  <>
                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                      {(value as File)?.name}
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                      Click to upload document
                                    </p>
                                  </>
                                )}
                              </div>
                              <input
                                id="document-upload"
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    onChange(file);
                                    setDocumentPreview(URL.createObjectURL(file));
                                  }
                                }}
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Upload car documents (PDF, DOC, DOCX)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="photo"
                      render={({ field: { onChange, value, ...field } }) => (
                        <FormItem>
                          <FormLabel>Photo</FormLabel>
                          <FormControl>
                            <div className="flex flex-col gap-4">
                              <div 
                                className={`
                                  border-2 border-dashed rounded-lg p-6 
                                  ${photoPreview ? 'border-muted' : 'border-muted-foreground/25'}
                                  hover:border-muted-foreground/50 transition-colors
                                  flex flex-col items-center justify-center gap-2
                                  cursor-pointer
                                  relative
                                  aspect-video
                                `}
                                onClick={() => document.getElementById('photo-upload')?.click()}
                              >
                                {photoPreview ? (
                                  <img 
                                    src={photoPreview} 
                                    alt="Car preview" 
                                    className="absolute inset-0 w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <>
                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                      Click to upload photo
                                    </p>
                                  </>
                                )}
                              </div>
                              <input
                                id="photo-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    onChange(file);
                                    setPhotoPreview(URL.createObjectURL(file));
                                  }
                                }}
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Upload car photo (JPG, PNG)
                          </FormDescription>
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
                      Adding...
                    </>
                  ) : (
                    'Add Car'
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
