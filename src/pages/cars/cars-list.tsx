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
import { Plus, Car as CarIcon, Loader2, FileText } from 'lucide-react';
import { RiFileWarningLine } from 'react-icons/ri';
import { Car } from '@/types';
import { apiClient } from '@/lib/api-client';
import { CarActions } from './car-actions';
import { useToast } from '@/components/ui/use-toast';
import { PageContainer } from '@/components/layout/page-container';
import numeral from 'numeral';
// import { ScrollArea } from '@/components/ui/scroll-area';

// Helper function to convert Google Drive link to direct image URL
const getGoogleDriveImageUrl = (url: string): string => {
  try {
    const fileId = url.split('/d/')[1].split('/')[0];
    return `https://drive.google.com/thumbnail?id=${fileId}`;
  } catch (error) {
    console.error('Error parsing Google Drive URL:', error);
    return url;
  }
};

// Helper function to extract location name from Google Maps URL
const extractLocationName = (url: string): { name: string; isLink: boolean } => {
  try {
    if (url.includes('google.com/maps')) {
      const placeMatch = url.match(/place\/([^/@]+)/);
      if (placeMatch && placeMatch[1]) {
        const name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
        const words = name.split(/\s+/);
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
          if (currentLine && currentLine.length + word.length + 1 > 20) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = currentLine ? `${currentLine} ${word}` : word;
          }
          if (lines.length >= 3) {
            lines[2] = lines[2] + '...';
            break;
          }
        }
        if (currentLine && lines.length < 3) {
          lines.push(currentLine);
        }
        return {
          name: lines.join('\n'),
          isLink: true
        };
      }
    }
    return { name: url, isLink: false };
  } catch (error) {
    return { name: url, isLink: false };
  }
};

// Helper function to format partner returns
const formatPartnerReturns = (returns: string): string => {
  if (!returns) return 'No returns data';
  const values = returns.split(',');
  if (values.length !== 3) return returns;
  
  return [
    `Azam: ${numeral(Math.ceil(Number(values[0]))).format('0.0a')}`,
    `Imran: ${numeral(Math.ceil(Number(values[1]))).format('0.0a')}`,
    `Ali: ${numeral(Math.ceil(Number(values[2]))).format('0.0a')}`
  ].join('\n');
};

// Image component with loading state
function CarImage({ url, alt }: { url: string; alt: string }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="h-20 w-20 rounded-md bg-secondary flex items-center justify-center">
        <CarIcon className="h-10 w-10 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-20 w-20 relative">
      {!imageLoaded && (
        <div className="absolute inset-0 rounded-md bg-secondary flex items-center justify-center">
          <CarIcon className="h-10 w-10 text-muted-foreground" />
        </div>
      )}
      <img 
        src={getGoogleDriveImageUrl(url)}
        alt={alt}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        className={`h-20 w-20 object-cover rounded-md transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}

export function CarsList() {
  const [cars, setCars] = useState<Car[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCars();
  }, [currentPage]);

//  Refresh list when window regains focus (user returns from edit page)
  useEffect(() => {
    function onFocus() {
      loadCars();
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  async function loadCars() {
    try {
      setLoading(true);
      const response = await apiClient.getCars(currentPage, limit);
      setCars(response.data);
      setTotalPages(response.pagination.totalPages);
      setLimit(response.pagination.limit);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load cars',
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
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Cars Inventory</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Manage your vehicle inventory
            </p>
          </div>
          <Link to="add">
            <Button>
              <Plus className="mr-4 h-4 w-4" />
              Add Car
            </Button>
          </Link>
        </div>

        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px]">Photo</TableHead>
                <TableHead>Car ID</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Purchase Price</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Profit/Loss</TableHead>
                <TableHead>Partner Returns</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Seller Info</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-24 text-center">
                    No cars found.
                  </TableCell>
                </TableRow>
              ) : (
                cars.map((car) => (
                  <TableRow key={car.id} className="h-24">
                    <TableCell>
                      {car.photo ? (
                        <a href={car.photo} target="_blank" rel="noopener noreferrer">
                          <CarImage url={car.photo} alt={`${car.make} ${car.model}`} />
                        </a>
                      ) : (
                        <div className="h-20 w-20 rounded-md bg-secondary flex items-center justify-center">
                          <CarIcon className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{car.id}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {car.make} {car.model} ({car.year})
                        </div>
                        <div className="text-sm text-muted-foreground">{car.color}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        car.currentStatus === 'Available' ? 'bg-green-100 text-green-800' 
                        : car.currentStatus === 'On Rent' ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {car.currentStatus}
                      </div>
                    </TableCell>
                    <TableCell>${car.purchasePrice.toLocaleString()}</TableCell>
                    <TableCell>${car.totalCost.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={car.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${Math.abs(car.profitLoss).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-pre-line">
                      {formatPartnerReturns(car.partnerReturns)}
                    </TableCell>
                    <TableCell className="max-w-[150px] whitespace-pre-line">
                      {(() => {
                        const { name, isLink } = extractLocationName(car.location);
                        return isLink ? (
                          <a 
                            href={car.location} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {name}
                          </a>
                        ) : name
                      })()}
                    </TableCell>
                    <TableCell>{new Date(car.purchaseDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{car.sellerName}</div>
                        <div className="text-muted-foreground">{car.sellerContact}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {car.documents ? (
                          <a 
                            href={car.documents} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-blue-600"
                            title="View Documents"
                          >
                            <FileText className="h-5 w-5" />
                          </a>
                        ) : (
                          <RiFileWarningLine 
                            className="h-5 w-5 text-muted-foreground" 
                            title="No Documents Available"
                          />
                        )}
                        <CarActions car={car} />
                      </div>
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
                // Show first page, last page, and pages around current page
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
                  onClick={() => currentPage !== totalPages && setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
    </PageContainer>
  );
}