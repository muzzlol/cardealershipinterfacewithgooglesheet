import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from '@/components/layout/navbar';
import { Dashboard } from '@/pages/dashboard';
import { Cars } from '@/pages/cars';
import { Repairs } from '@/pages/repairs';
import { Sales } from '@/pages/sales';
import { Partners } from '@/pages/partners';
import { Reports } from '@/pages/reports';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <Router>
      <div className="min-h-screen w-screen bg-background">
        <Navbar />
        <div className="pt-14 w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cars/*" element={<Cars />} />
            <Route path="/repairs/*" element={<Repairs />} />
            <Route path="/sales/*" element={<Sales />} />
            <Route path="/partners/*" element={<Partners />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </div>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;