import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn(
      "container mx-auto px-4 py-6 max-w-7xl",
      "sm:px-6 lg:px-8",
      className
    )}>
      {children}
    </div>
  );
}
