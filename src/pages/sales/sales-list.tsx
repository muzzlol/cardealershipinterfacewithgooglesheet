import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageContainer } from '@/components/layout/page-container';
import { apiClient } from '@/lib/api-client';
import type { Sale } from '@/types';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function SalesList() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getSales();
      setSales(data);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load sales',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Sales</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              View and manage your sales records
            </p>
          </div>
          <Link to="/sales/add">
            <Button>Record Sale</Button>
          </Link>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sale ID</TableHead>
                <TableHead>Car ID</TableHead>
                <TableHead>Sale Date</TableHead>
                <TableHead>Buyer Name</TableHead>
                <TableHead className="text-right">Sale Price</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.id}</TableCell>
                  <TableCell>{sale.carId}</TableCell>
                  <TableCell>{format(new Date(sale.saleDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{sale.buyerName}</TableCell>
                  <TableCell className="text-right">SAR {sale.salePrice.toLocaleString()}</TableCell>
                  <TableCell className="text-right">SAR {sale.profit.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={5} className="text-right font-medium">
                  Total Profit
                </TableCell>
                <TableCell className="text-right font-medium">
                  SAR {totalProfit.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </PageContainer>
  );
}
