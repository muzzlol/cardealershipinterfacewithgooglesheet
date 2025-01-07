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
import { Plus, Wrench, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api-client';
import { Repair } from '@/types';
import { PageContainer } from '@/components/layout/page-container';

export function RepairsList() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRepairs();
  }, []);

  // Refresh list when window regains focus
  useEffect(() => {
    function onFocus() {
      loadRepairs();
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
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
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Repairs</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Track vehicle repairs and maintenance
          </p>
        </div>
        <Link to="add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Repair
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[100px]">Repair ID</TableHead>
              <TableHead>Car Info</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Mechanic</TableHead>
              <TableHead>Service Provider</TableHead>
              <TableHead className="text-right">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {repairs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">No repairs recorded.</TableCell>
                  No repairs recorded.
                </TableRow>
              ) : (
                repairs.map((repair) => (
                  <TableRow key={repair.id}>
                    <TableCell className="font-medium">{repair.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-secondary p-2">
                          <Wrench className="h-4 w-4" />
                        </div>
                        <div className="font-medium">{repair.carId}</div>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(repair.repairDate).toLocaleDateString()}</TableCell>
                    <TableCell>{repair.description}</TableCell>
                    <TableCell>{repair.mechanicName}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{repair.serviceProvider.name}</div>
                        <div className="text-muted-foreground">{repair.serviceProvider.contact}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      ${repair.cost.toLocaleString()}
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
