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
import { Plus, ChevronRight, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api-client';
import { Repair } from '@/types';
import { PageContainer } from '@/components/layout/page-container';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';

interface GroupedRepairs {
  carId: string;
  totalCost: number;
  repairs: Repair[];
}

export function RepairsList() {
  const [groupedRepairs, setGroupedRepairs] = useState<GroupedRepairs[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [openCarIds, setOpenCarIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadRepairs();
  }, [currentPage]);

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
      const response = await apiClient.getRepairsGroupedByCar(currentPage, limit);
      setGroupedRepairs(response.data);
      setTotalPages(response.pagination.totalPages);
      setLimit(response.pagination.limit);
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

  const toggleCarRepairs = (carId: string) => {
    const newOpenCarIds = new Set(openCarIds);
    if (newOpenCarIds.has(carId)) {
      newOpenCarIds.delete(carId);
    } else {
      newOpenCarIds.add(carId);
    }
    setOpenCarIds(newOpenCarIds);
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

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Car Details</TableHead>
              <TableHead className="text-right">Total Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedRepairs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">No repairs recorded.</TableCell>
              </TableRow>
            ) : (
              groupedRepairs.map(({ carId, repairs, totalCost }) => (
                <>
                  <TableRow 
                    key={carId}
                    className="cursor-pointer hover:bg-muted/50 group"
                    onClick={() => toggleCarRepairs(carId)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <ChevronRight 
                          className={`h-4 w-4 transition-transform ${
                            openCarIds.has(carId) ? 'rotate-90' : ''
                          }`}
                        />
                        <div>
                          <div className="font-medium">{carId}</div>
                          <div className="text-sm text-muted-foreground">
                            {repairs.length} {repairs.length === 1 ? 'repair' : 'repairs'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      SAR {totalCost.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  {openCarIds.has(carId) && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={2} className="p-0">
                        <div className="bg-muted/30">
                          <div className="px-4 py-3">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[20%]">Date</TableHead>
                                  <TableHead className="w-[35%]">Description</TableHead>
                                  <TableHead className="w-[25%]">Service Details</TableHead>
                                  <TableHead className="w-[20%] text-right">Cost</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {repairs.map((repair) => (
                                  <TableRow key={repair.id}>
                                    <TableCell>
                                      {new Date(repair.repairDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{repair.description}</TableCell>
                                    <TableCell>
                                      <div className="text-sm">
                                        <div className="font-medium">{repair.serviceProvider.name}</div>
                                        <div className="text-muted-foreground">{repair.mechanicName}</div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      SAR {repair.cost.toLocaleString()}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex justify-center">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <Button
                  variant={currentPage === page ? "outline" : "ghost"}
                  size="icon"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </PageContainer>
  );
}
