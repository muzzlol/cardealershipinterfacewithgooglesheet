import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, DollarSign, Users } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';

export function Dashboard() {
  const [metrics, setMetrics] = useState({
    totalCars: 0,
    availableCars: 0,
    totalProfit: 0,
    partnerEarnings: 0,
  });

  useEffect(() => {
    // Fetch metrics from API
  }, []);

  const cards = [
    {
      title: 'Total Cars',
      value: metrics.totalCars,
      icon: Car,
      description: `${metrics.availableCars} available`,
    },
    {
      title: 'Total Profit',
      value: `${metrics.totalProfit.toLocaleString()} SAR`,
      icon: DollarSign,
      description: 'All time profit',
    },
    {
      title: 'Recent Repairs',
      value: '5',
      icon: Car,
      description: 'Last 30 days',
    },
    {
      title: 'Partner Earnings',
      value: `${metrics.partnerEarnings.toLocaleString()} SAR`,
      icon: Users,
      description: 'Total distributions',
    },
  ];

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold sm:text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your business metrics
          </p>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.title} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className="rounded-full bg-primary/10 p-2">
                  <card.icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}