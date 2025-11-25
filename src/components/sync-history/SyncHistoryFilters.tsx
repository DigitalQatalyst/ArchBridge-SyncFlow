import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { SyncHistoryFilters as SyncHistoryFiltersType, SyncStatus } from '@/types/sync-history';

interface SyncHistoryFiltersProps {
  filters: SyncHistoryFiltersType;
  onFiltersChange: (filters: SyncHistoryFiltersType) => void;
  onReset: () => void;
}

export function SyncHistoryFilters({ filters, onFiltersChange, onReset }: SyncHistoryFiltersProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.start_date ? new Date(filters.start_date) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    filters.end_date ? new Date(filters.end_date) : undefined
  );

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === 'all' ? undefined : (value as SyncStatus),
      offset: 0, // Reset to first page
    });
  };

  const handleSourceTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      source_type: value === 'all' ? undefined : value,
      offset: 0,
    });
  };

  const handleTargetTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      target_type: value === 'all' ? undefined : value,
      offset: 0,
    });
  };

  const handleProjectNameChange = (value: string) => {
    onFiltersChange({
      ...filters,
      project_name: value || undefined,
      offset: 0,
    });
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    onFiltersChange({
      ...filters,
      start_date: date ? format(date, 'yyyy-MM-dd') : undefined,
      offset: 0,
    });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    onFiltersChange({
      ...filters,
      end_date: date ? format(date, 'yyyy-MM-dd') : undefined,
      offset: 0,
    });
  };

  const hasActiveFilters =
    filters.status ||
    filters.source_type ||
    filters.target_type ||
    filters.project_name ||
    filters.start_date ||
    filters.end_date;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source-type">Source Type</Label>
            <Select
              value={filters.source_type || 'all'}
              onValueChange={handleSourceTypeChange}
            >
              <SelectTrigger id="source-type">
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="ardoq">Ardoq</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-type">Target Type</Label>
            <Select
              value={filters.target_type || 'all'}
              onValueChange={handleTargetTypeChange}
            >
              <SelectTrigger id="target-type">
                <SelectValue placeholder="All targets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Targets</SelectItem>
                <SelectItem value="azure-devops">Azure DevOps</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="Search project..."
              value={filters.project_name || ''}
              onChange={(e) => handleProjectNameChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={handleStartDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !endDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={handleEndDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

