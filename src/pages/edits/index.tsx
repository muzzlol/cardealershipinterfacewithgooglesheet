import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Car, Repair, Sale } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageContainer } from '@/components/layout/page-container';
import { Loader2 } from 'lucide-react';

interface RecentEntries {
  cars: Car[];
  repairs: Repair[];
  sales: Sale[];
}

type EntryType = 'car' | 'repair' | 'sale';

interface EditableEntry {
  type: EntryType;
  data: Car | Repair | Sale | null;
  id: string;
}

export function Edits() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<RecentEntries>({ cars: [], repairs: [], sales: [] });
  const [selectedEntries, setSelectedEntries] = useState<Record<EntryType, EditableEntry>>({
    car: { type: 'car', data: null, id: '' },
    repair: { type: 'repair', data: null, id: '' },
    sale: { type: 'sale', data: null, id: '' },
  });
  const [editedData, setEditedData] = useState<Partial<Record<EntryType, Car | Repair | Sale>>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchRecentEntries();
  }, []);

  const fetchRecentEntries = async () => {
    try {
      const response = await apiClient.get<RecentEntries>('/recent-entries');
      setEntries(response);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch recent entries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEntrySelect = (type: EntryType, id: string) => {
    const entryList = entries[`${type}s`];
    const selectedEntry = entryList.find((entry) => entry.id === id);
    setSelectedEntries((prev) => ({
      ...prev,
      [type]: { type, data: selectedEntry, id },
    }));
    setEditedData((prev) => ({ ...prev, [type]: { ...selectedEntry } }));
  };

  const handleInputChange = (type: EntryType, field: string, value: string | number) => {
    setEditedData((prev) => {
      const currentData = { ...prev[type] } as Record<string, any>;
      
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        currentData[parent] = {
          ...currentData[parent],
          [child]: value,
        };
      } else {
        currentData[field] = value;
      }
      
      return { ...prev, [type]: currentData };
    });
  };

  const handleSave = async (type: EntryType) => {
    try {
      setLoading(true);
      const id = selectedEntries[type].id;
      await apiClient.put(`/${type}s/${id}`, editedData[type]);
      
      toast({
        title: 'Success',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`,
      });
      
      await fetchRecentEntries();
    } catch (error) {
      console.error('Error updating:', error);
      toast({
        title: 'Error',
        description: `Failed to update ${type}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderField = (type: EntryType, field: string, editedEntry: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      return (
        <Input
          value={editedEntry?.[parent]?.[child] || ''}
          onChange={(e) => handleInputChange(
            type,
            field,
            field.includes('rice') || field.includes('cost') || field.includes('profit')
              ? parseFloat(e.target.value)
              : e.target.value
          )}
          type={field.includes('rice') || field.includes('cost') || field.includes('profit') ? 'number' : 'text'}
        />
      );
    }

    if (field === 'currentStatus') {
      return (
        <Select
          value={editedEntry?.[field] || ''}
          onValueChange={(value) => handleInputChange(type, field, value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="Sold">Sold</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (field === 'paymentStatus') {
      return (
        <Select
          value={editedEntry?.[field] || ''}
          onValueChange={(value) => handleInputChange(type, field, value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        value={editedEntry?.[field] || ''}
        onChange={(e) => handleInputChange(
          type,
          field,
          field.includes('rice') || field.includes('cost') || field.includes('profit')
            ? parseFloat(e.target.value)
            : field === 'year'
            ? parseInt(e.target.value)
            : e.target.value
        )}
        type={
          field.includes('rice') || field.includes('cost') || field.includes('profit') || field === 'year'
            ? 'number'
            : field.includes('Date')
            ? 'date'
            : 'text'
        }
      />
    );
  };

  const renderEditCard = (type: EntryType, fields: string[]) => {
    const entry = selectedEntries[type];
    const editedEntry = editedData[type];
    const entryList = entries[`${type}s`];

    if (!entryList?.length) return null;

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="capitalize">{type}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select
              value={entry.id}
              onValueChange={(value) => handleEntrySelect(type, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${type}`} />
              </SelectTrigger>
              <SelectContent>
                {entryList.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {type === 'car' && 'make' in item ? `${item.make} ${item.model}` :
                     type === 'repair' && 'description' in item ? `${item.description}` :
                     'buyerName' in item ? `${item.buyerName}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {entry.data && (
              <div className="grid grid-cols-2 gap-4">
                {fields.map((field) => (
                  <div key={field} className="space-y-2">
                    <label className="text-sm font-medium capitalize">
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    {renderField(type, field, editedEntry)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        {entry.data && (
          <CardFooter className="justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedEntries((prev) => ({
                  ...prev,
                  [type]: { type, data: null, id: '' },
                }));
                setEditedData((prev) => ({ ...prev, [type]: null }));
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSave(type)}
              disabled={loading || JSON.stringify(editedEntry) === JSON.stringify(entry.data)}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {renderEditCard('car', [
          'make',
          'model',
          'year',
          'color',
          'registrationNumber',
          'purchasePrice',
          'purchaseDate',
          'currentStatus',
          'condition',
          'sellerName',
          'sellerContact',
          'additionalCosts.transport',
          'additionalCosts.inspection',
          'additionalCosts.other',
        ])}

        {renderEditCard('repair', [
          'carId',
          'repairDate',
          'description',
          'cost',
          'mechanicName',
          'serviceProvider.name',
          'serviceProvider.contact',
          'serviceProvider.address',
        ])}

        {renderEditCard('sale', [
          'carId',
          'saleDate',
          'salePrice',
          'buyerName',
          'buyerContactInfo',
          'profit',
          'paymentStatus',
          'totalRepairCosts',
          'netProfit',
        ])}
      </div>
    </PageContainer>
  );
}