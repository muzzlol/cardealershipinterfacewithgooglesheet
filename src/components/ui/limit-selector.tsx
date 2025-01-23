import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface LimitSelectorProps {
  value: number;
  onValueChange: (value: number) => void;
}

export function LimitSelector({ value, onValueChange }: LimitSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Rows per page</span>
      <Select
        value={value.toString()}
        onValueChange={(val) => onValueChange(Number(val))}
      >
        <SelectTrigger className="w-[70px]">
          <SelectValue placeholder={value} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="5">5</SelectItem>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="20">20</SelectItem>
          <SelectItem value="50">50</SelectItem>
          <SelectItem value="100">100</SelectItem>
          <SelectItem value="200">200</SelectItem>
          <SelectItem value="500">500</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}