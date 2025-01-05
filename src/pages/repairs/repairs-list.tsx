import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { PageContainer } from '@/components/layout/page-container';

interface Repair {
  id: string;
  carId: string;
  date: string;
  description: string;
  cost: number;
  mechanic: string;
}

export function RepairsList() {
  const [repairs] = useState<Repair[]>([
    {
      id: 'R001',
      carId: 'C001',
      date: '2024-01-01',
      description: 'Oil change and filter replacement',
      cost: 350,
      mechanic: 'Ahmed',
    },
    {
      id: 'R002',
      carId: 'C002',
      date: '2024-01-02',
      description: 'Brake pad replacement',
      cost: 800,
      mechanic: 'Mohammed',
    },
  ]);
  
  const navigate = useNavigate();

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
          <Button onClick={() => navigate('add')} className="sm:w-auto w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Repair
          </Button>
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
                    <TableCell>{new Date(repair.date).toLocaleDateString()}</TableCell>
                    <TableCell>{repair.description}</TableCell>
                    <TableCell>{repair.mechanic}</TableCell>
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
