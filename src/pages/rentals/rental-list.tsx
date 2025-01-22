import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Button } from '@/components/ui/button';
import { Plus, Car as CarIcon, Loader2 } from 'lucide-react';
import { Rental } from '@/types';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/use-toast';
import { PageContainer } from '@/components/layout/page-container';
import { format, differenceInDays } from 'date-fns';

export function RentalList() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadRentals();
  }, [currentPage]);

  // Refresh list when window regains focus
  useEffect(() => {
    function onFocus() {
      loadRentals();
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  async function loadRentals() {
    try {
      setLoading(true);
      const response = await apiClient.getRentals(currentPage, limit);
      setRentals(response.data);
      setTotalPages(response.pagination.totalPages);
      setLimit(response.pagination.limit);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load rentals',
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
    <PageContainer>
      <div className="flex flex-col gap-4 md:flex-row justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Rentals</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Manage your vehicle rentals
          </p>
        </div>
        <Link to="add">
          <Button>
            <Plus className="mr-4 h-4 w-4" />
            Add Rental
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Rental ID</TableHead>
              <TableHead>Car ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Daily Rate</TableHead>
              <TableHead className="text-right">Additional Fees</TableHead>
              <TableHead className="text-right">Total Earned</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rentals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No rentals found.
                </TableCell>
              </TableRow>
            ) : (
              rentals.map((rental) => (
                <TableRow key={rental.id}>
                  <TableCell className="font-medium">{rental.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-secondary p-2">
                        <CarIcon className="h-4 w-4" />
                      </div>
                      <div className="font-medium">{rental.carId}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{rental.customerName}</div>
                      <div className="text-muted-foreground">{rental.customerContact}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{format(new Date(rental.startDate), 'MMM d, yyyy')} -</div>
                      <div>{format(new Date(rental.returnDate), 'MMM d, yyyy')}</div>
                      <div className="text-muted-foreground">
                        {rental.daysOut} days out, {rental.daysLeft} days left
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      rental.rentalStatus === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rental.rentalStatus}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    SAR {rental.dailyRate.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-sm">
                      {rental.damageFee > 0 && <div>Damage: SAR {rental.damageFee.toLocaleString()}</div>}
                      {rental.lateFee > 0 && <div>Late: SAR {rental.lateFee.toLocaleString()}</div>}
                      {rental.otherFee > 0 && (
                        <div title={rental.additionalCostsDescription || 'Other fees'}>
                          Other: SAR {rental.otherFee.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    SAR {rental.totalRentEarned.toLocaleString()}
                  </TableCell>
                </TableRow>
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
                onClick={() => currentPage > 1 && setCurrentPage(prev => prev - 1)}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
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
                onClick={() => currentPage < totalPages && setCurrentPage(prev => prev + 1)}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </PageContainer>
  );
}