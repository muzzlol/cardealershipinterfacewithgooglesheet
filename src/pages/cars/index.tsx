import { Routes, Route } from 'react-router-dom';
import { CarsList } from './cars-list';
import { AddCar } from './add-car';
// import { EditCar } from './edit-car'; // TODO: Implement edit car functionality

export function Cars() {
  return (
    <Routes>
      <Route index element={<CarsList />} />
      <Route path="add" element={<AddCar />} />
      {/* <Route path="edit/:id" element={<EditCar />} /> */}
    </Routes>
  );
}