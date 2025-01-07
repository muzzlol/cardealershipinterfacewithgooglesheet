import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, DollarSign, WrenchIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Car } from '@/types';

interface CarActionsProps {
  car: Car;
}

export function CarActions({ car }: CarActionsProps) {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate(`edit/${car.id}`)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/repairs/add?carId=${car.id}`)}>
          <WrenchIcon className="mr-2 h-4 w-4" />
          Add Repair
        </DropdownMenuItem>
        {car.currentStatus === 'Available' && (
          <DropdownMenuItem onClick={() => navigate(`/sales/add?carId=${car.id}`)}>
            <DollarSign className="mr-2 h-4 w-4" />
            Record Sale
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}