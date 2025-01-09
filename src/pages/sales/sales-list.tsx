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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationEllipsis, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';

export function SalesList() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const { toast } = useToast();

  useEffect(() => {
    loadSales();
  }, [currentPage]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getSales(currentPage, limit);
      setSales(response.data);
      setTotalPages(response.pagination.totalPages);
      setLimit(response.pagination.limit);
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
        <div className="mt-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNumber)}
                        isActive={currentPage === pageNumber}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (
                  pageNumber === currentPage - 2 ||
                  pageNumber === currentPage + 2
                ) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </PageContainer>
  );
}
