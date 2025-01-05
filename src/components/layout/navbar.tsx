import { Link } from 'react-router-dom';
import { Menu, Home, Car, WrenchIcon, DollarSign, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/cars', icon: Car, label: 'Cars' },
    { href: '/repairs', icon: WrenchIcon, label: 'Repairs' },
    { href: '/sales', icon: DollarSign, label: 'Sales' },
    { href: '/partners', icon: Users, label: 'Partners' },
    { href: '/reports', icon: FileText, label: 'Reports' },
  ];

  return (
    <nav className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto">
        <div className="flex h-14 items-center px-4">
          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col py-2">
                {links.map(({ href, icon: Icon, label }) => (
                  <Link 
                    key={href} 
                    to={href} 
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors',
                      location.pathname === href && 'text-primary'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1 h-full flex-1">
            {links.map(({ href, icon: Icon, label }) => {
              const isActive = location.pathname === href;
              return (
                <Link
                  key={href}
                  to={href}
                  className={cn(
                    'h-full px-4 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary relative transition-colors',
                    isActive && 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}