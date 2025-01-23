import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from '@/components/layout/navbar';
import { Dashboard } from '@/pages/dashboard';
import { Cars } from '@/pages/cars';
import { Repairs } from '@/pages/repairs';
import { Sales } from '@/pages/sales';
import { Rentals } from '@/pages/rentals';
import { Edits } from '@/pages/edits';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Router>
        <div className="min-h-screen w-screen bg-background text-foreground">
          <Navbar />
          <div className="pt-14 w-full">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/cars/*" element={<Cars />} />
              <Route path="/repairs/*" element={<Repairs />} />
              <Route path="/rentals/*" element={<Rentals />} />
              <Route path="/sales/*" element={<Sales />} />
              <Route path="/edits/*" element={<Edits />} />
            </Routes>
          </div>
          <Toaster />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;