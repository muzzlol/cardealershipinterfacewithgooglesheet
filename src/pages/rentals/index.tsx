import { Routes, Route } from 'react-router-dom';
import { RentalList } from './rental-list';
import { AddRental } from './add-rental';

export function Rentals() {
  return (
    <Routes>
      <Route index element={<RentalList />} />
      <Route path="add" element={<AddRental />} />
    </Routes>
  );
}