import { Routes, Route } from 'react-router-dom';
import { RepairsList } from './repairs-list';
import { AddRepair } from './add-repair';

export function Repairs() {
  return (
    <Routes>
      <Route index element={<RepairsList />} />
      <Route path="add" element={<AddRepair />} />
    </Routes>
  );
}