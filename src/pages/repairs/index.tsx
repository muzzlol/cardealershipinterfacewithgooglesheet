import { Routes, Route } from 'react-router-dom';
import { RepairsList } from './repairs-list';
import { AddRepair } from './add-repair';

export function Repairs() {
  return (
    <div className="space-y-6">
      <Routes>
        <Route index element={<RepairsList />} />
        <Route path="add" element={<AddRepair />} />
      </Routes>
    </div>
  );
}