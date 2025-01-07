import { Link } from 'react-router-dom';
import { Menu, Home, Car, WrenchIcon, DollarSign, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme-toggle';

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
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center">
          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Menu className="h-6 w-6 cursor-pointer text-foreground hover:text-muted-foreground" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4">
                {links.map((route, i) => {
                  const isActive = location.pathname === route.href;
                  return (
                    <Link
                      key={i}
                      to={route.href}
                      className={cn(
                        'block px-2 py-1 text-lg transition-colors hover:text-primary',
                        isActive ? 'text-black dark:text-white' : 'text-muted-foreground'
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      {route.label}
                    </Link>
                  );
                })}
                <div className="mt-4 border-t pt-4">
                  <ThemeToggle />
                </div>
              </nav>
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
            <div className="ml-auto hidden md:block">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}