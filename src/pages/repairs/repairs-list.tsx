import { useEffect, useState } from 'react';
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
import { Loader2, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api-client';
import { Repair } from '@/types';
import { PageContainer } from '@/components/layout/page-container';

export function RepairsList() {                                             
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRepairs();
  }, []);

  async function loadRepairs() {
    try {
      setLoading(true);
      const data = await apiClient.getRepairs();
      setRepairs(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load repairs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }
  const { toast } = useToast();
  
  loading && (
    <div className="flex h-[200px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <PageContainer>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Repairs</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Track vehicle repairs and maintenance
            </p>
          </div>

          <Link to="/repairs">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Repair
            </Button>
          </Link>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Repair ID</TableHead>
                <TableHead>Car ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Mechanic</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repairs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No repairs recorded.
                  </TableCell>
                </TableRow>
              ) : (
                repairs.map((repair) => (
                  <TableRow key={repair.id}>
                    <TableCell className="font-medium">{repair.id}</TableCell>
                    <TableCell>{repair.carId}</TableCell>
                    <TableCell>{new Date(repair.repairDate).toLocaleDateString()}</TableCell>
                    <TableCell>{repair.description}</TableCell>
                    <TableCell>{repair.mechanicName}</TableCell>
                    <TableCell className="text-right">
                      {repair.cost.toLocaleString()} SAR
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
