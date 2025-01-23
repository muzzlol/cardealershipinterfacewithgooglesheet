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
import { AuthProvider } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { Login } from '@/pages/login';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Router>
        <AuthProvider>
          <div className="min-h-screen w-screen bg-background text-foreground">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <div>
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
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>
            <Toaster />
          </div>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;