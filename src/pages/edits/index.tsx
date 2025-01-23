import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { apiClient } from '@/lib/api-client';
import { Car, Repair, Sale, Rental } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/components/ui/use-toast';
import { PageContainer } from '@/components/layout/page-container';
import { Loader2 } from 'lucide-react';

interface RecentEntries {
  cars: Car[];
  repairs: Repair[];
  sales: Sale[];
  rentals: Rental[];
}

type EntryType = 'car' | 'repair' | 'sale' | 'rental';

interface EditableEntry {
  type: EntryType;
  data: Car | Repair | Sale | Rental;
  id: string;
}

const EDITABLE_FIELDS: Record<EntryType, string[]> = {
  car: ['make', 'model', 'year', 'color', 'registrationNumber', 'purchasePrice', 'purchaseDate', 'condition', 'sellerName', 'sellerContact', 'transportCost', 'inspectionCost', 'otherCosts', 'location', 'investmentSplit'],
  repair: ['carId', 'repairDate', 'description', 'mechanicName', 'cost', 'serviceProvider'],
  sale: ['carId', 'saleDate', 'salePrice', 'buyerName', 'buyerContactInfo', 'paymentStatus'],
  rental: ['carId', 'customerName', 'customerContact', 'startDate', 'returnDate', 'dailyRate', 'damageFee', 'lateFee', 'otherFee', 'additionalCostsDescription']
};

export function Edits() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<RecentEntries>({ cars: [], repairs: [], sales: [], rentals: [] });
  const [selectedEntry, setSelectedEntry] = useState<EditableEntry | null>(null);
  const [editableData, setEditableData] = useState<Record<string, any> | null>(null);
  const [availableCars, setAvailableCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecentEntries();
  }, []);

  const fetchRecentEntries = async () => {
    try {
      const response = await apiClient.getRecentEntries();
      setEntries({
        cars: response.cars || [],
        repairs: response.repairs || [],
        sales: response.sales || [],
        rentals: response.rentals || []
      });
    } catch (error) {
      console.error('Error fetching recent entries:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch recent entries',
        variant: 'destructive',
      });
    }
  };

  const handleEntrySelect = (type: EntryType, data: Car | Repair | Sale | Rental) => {
    setSelectedEntry({ type, data, id: data.id });
    const editableFields = EDITABLE_FIELDS[type];
    const editableData = Object.fromEntries(
      Object.entries(data).filter(([key]) => editableFields.includes(key))
    );
    setEditableData(editableData);
  };

  const handleInputChange = (field: string, value: any) => {
    if (!editableData || !selectedEntry) return;

    setEditableData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const handleSave = async () => {
    if (!selectedEntry || !editableData) return;

    try {
      setLoading(true);
      let response;
      switch (selectedEntry.type) {
        case 'car': {
          const formData = new FormData();
          Object.entries(editableData).forEach(([key, value]) => {
            formData.append(key, String(value));
          });
          response = await apiClient.updateCar(selectedEntry.id, formData);
          break;
        }
        case 'repair':
          response = await apiClient.updateRepair(selectedEntry.id, editableData);
          break;
        case 'sale':
          response = await apiClient.updateSale(selectedEntry.id, editableData);
          break;
        case 'rental':
          response = await apiClient.updateRental(selectedEntry.id, editableData);
          break;
      }

      if (response) {
        await fetchRecentEntries();
        setSelectedEntry(null);
        setEditableData(null);
        toast({
          title: 'Success',
          description: `${selectedEntry.type.charAt(0).toUpperCase() + selectedEntry.type.slice(1)} updated successfully`,
        });
      }
    } catch (error) {
      console.error('Error updating:', error);
      toast({
        title: 'Error',
        description: `Failed to update ${selectedEntry.type}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: string, value: any) => {
    if (!selectedEntry) return null;

    const renderSelect = (options: { value: string; label: string }[]) => (
      <Select 
        value={String(value || '')} 
        onValueChange={(newValue) => handleInputChange(field, newValue)}
        disabled={field === 'carId' && selectedEntry.type !== 'car'}
      >
        <SelectTrigger>
          <SelectValue placeholder={`Select ${field}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );

    if (field === 'carId' && (selectedEntry?.type === 'repair' || selectedEntry?.type === 'sale' || selectedEntry?.type === 'rental')) {
      const car = availableCars.find(c => c.id === value);
      return (
        <div className="flex items-center space-x-2 p-2 bg-neutral-100 dark:bg-neutral-900 rounded-md">
          <span className="text-sm">Car #{value}</span>
          {car && <span className="text-sm text-neutral-500">({car.make} {car.model} - {car.registrationNumber})</span>}
        </div>
      );
    }

    if (field === 'paymentStatus') {
      return renderSelect([
        { value: 'Paid', label: 'Paid' },
        { value: 'Unpaid', label: 'Unpaid' }
      ]);
    }

    if (field === 'condition') {
      return renderSelect([
        { value: 'Excellent', label: 'Excellent' },
        { value: 'Good', label: 'Good' },
        { value: 'Fair', label: 'Fair' },
        { value: 'Poor', label: 'Poor' }
      ]);
    }

    if (field === 'startDate' || field === 'returnDate' || field === 'purchaseDate' || field === 'saleDate' || field === 'repairDate') {
      return (
        <DatePicker
          value={value ? new Date(String(value)) : undefined}
          onChange={(date) => handleInputChange(field, date ? format(date, 'yyyy-MM-dd') : null)}
        />
      );
    }

    if (field === 'purchasePrice' || field === 'salePrice' || field === 'transportCost' || field === 'inspectionCost' || field === 'otherCosts' || field === 'damageFee' || field === 'lateFee' || field === 'otherFee' || field === 'dailyRate' || field === 'cost') {
      return (
        <Input
          type="number"
          value={String(value || '')}
          onChange={(e) => handleInputChange(field, parseFloat(e.target.value) || 0)}
        />
      );
    }

    if (field === 'year') {
      return (
        <Input
          type="number"
          value={String(value || '')}
          onChange={(e) => handleInputChange(field, parseInt(e.target.value) || new Date().getFullYear())}
        />
      );
    }

    if (field === 'serviceProvider') {
      return (
        <div className="space-y-2">
          <div>
            <Label>Name</Label>
            <Input
              value={value?.name || ''}
              onChange={(e) => handleInputChange(`${field}.name`, e.target.value)}
            />
          </div>
          <div>
            <Label>Contact</Label>
            <Input
              value={value?.contact || ''}
              onChange={(e) => handleInputChange(`${field}.contact`, e.target.value)}
            />
          </div>
          <div>
            <Label>Address</Label>
            <Input
              value={value?.address || ''}
              onChange={(e) => handleInputChange(`${field}.address`, e.target.value)}
            />
          </div>
        </div>
      );
    }

    return (
      <Input
        type="text"
        value={String(value || '')}
        onChange={(e) => handleInputChange(field, e.target.value)}
      />
    );
  };

  const renderEditCard = () => {
    if (!selectedEntry || !editableData) return null;

    const fields = EDITABLE_FIELDS[selectedEntry.type];

    return (
      <Card className="w-full max-w-2xl mx-auto mt-4">
        <CardHeader>
          <CardTitle>Edit {selectedEntry.type.charAt(0).toUpperCase() + selectedEntry.type.slice(1)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {fields.map((field) => (
              <div key={field} className="grid gap-2">
                <Label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1)}</Label>
                {renderField(field, editableData[field])}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => {
            setSelectedEntry(null);
            setEditableData(null);
          }}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const renderEntryButton = (type: EntryType, data: Car | Repair | Sale | Rental) => {
    let displayText = '';
    
    switch (type) {
      case 'car':
        const car = data as Car;
        displayText = `#${car.id} - ${car.make} ${car.model} (${car.registrationNumber})`;
        break;
      case 'repair':
        const repair = data as Repair;
        displayText = `#${repair.id} - ${format(new Date(repair.repairDate), 'dd/MM/yyyy')} - ${repair.description} (Car #${repair.carId})`;
        break;
      case 'sale':
        const sale = data as Sale;
        displayText = `#${sale.id} - ${format(new Date(sale.saleDate), 'dd/MM/yyyy')} - ${sale.buyerName} (Car #${sale.carId})`;
        break;
      case 'rental':
        const rental = data as Rental;
        displayText = `#${rental.id} - ${rental.customerName} - ${format(new Date(rental.startDate), 'dd/MM/yyyy')} to ${format(new Date(rental.returnDate), 'dd/MM/yyyy')} (Car #${rental.carId})`;
        break;
    }

    return (
      <Button
        key={data.id}
        variant="outline"
        className="w-full justify-start rounded-none border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900"
        onClick={() => handleEntrySelect(type, data)}
      >
        {displayText}
      </Button>
    );
  };
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
    <PageContainer>
      <div className="grid gap-4">
        <h1 className="text-2xl font-bold">Recent Entries</h1>
        <div className="grid gap-4 md:grid-cols-2">
          {entries.cars.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Cars</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {entries.cars.map((car) => renderEntryButton('car', car))}
              </CardContent>
            </Card>
          )}
          {entries.repairs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Repairs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {entries.repairs.map((repair) => renderEntryButton('repair', repair))}
              </CardContent>
            </Card>
          )}
          {entries.sales.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {entries.sales.map((sale) => renderEntryButton('sale', sale))}
              </CardContent>
            </Card>
          )}
          {entries.rentals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Rentals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {entries.rentals.map((rental) => renderEntryButton('rental', rental))}
              </CardContent>
            </Card>
          )}
        </div>
        {renderEditCard()}
      </div>
    </PageContainer>
  );
}