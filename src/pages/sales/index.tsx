import { Routes, Route } from 'react-router-dom';
import { SalesList } from './sales-list';
import { AddSale } from './add-sale';

export function Sales() {
  return (
    <Routes>
      <Route index element={<SalesList />} />
      <Route path="add" element={<AddSale />} />
    </Routes>
  );
}