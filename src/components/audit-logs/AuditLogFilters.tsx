import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import type { AuditLogFilters as AuditLogFiltersType, ActionType } from '@/types/sync-history';

interface AuditLogFiltersProps {
  filters: AuditLogFiltersType;
  onFiltersChange: (filters: AuditLogFiltersType) => void;
  onReset: () => void;
}

const actionTypeOptions: { value: ActionType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Actions' },
  { value: 'sync_started', label: 'Sync Started' },
  { value: 'sync_completed', label: 'Sync Completed' },
  { value: 'sync_failed', label: 'Sync Failed' },
  { value: 'sync_cancelled', label: 'Sync Cancelled' },
  { value: 'config_created', label: 'Config Created' },
  { value: 'config_updated', label: 'Config Updated' },
  { value: 'config_deleted', label: 'Config Deleted' },
  { value: 'config_activated', label: 'Config Activated' },
  { value: 'connection_tested', label: 'Connection Tested' },
];

export function AuditLogFilters({ filters, onFiltersChange, onReset }: AuditLogFiltersProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.start_date ? new Date(filters.start_date) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    filters.end_date ? new Date(filters.end_date) : undefined
  );

  const handleActionTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      action_type: value === 'all' ? undefined : (value as ActionType),
      offset: 0,
    });
  };

  const handleEntityTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      entity_type: value === 'all' ? undefined : value,
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
    filters.action_type ||
    filters.entity_type ||
    filters.entity_id ||
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
            <Label htmlFor="action-type">Action Type</Label>
            <Select
              value={filters.action_type || 'all'}
              onValueChange={handleActionTypeChange}
            >
              <SelectTrigger id="action-type">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                {actionTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entity-type">Entity Type</Label>
            <Select
              value={filters.entity_type || 'all'}
              onValueChange={handleEntityTypeChange}
            >
              <SelectTrigger id="entity-type">
                <SelectValue placeholder="All entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="sync">Sync</SelectItem>
                <SelectItem value="configuration">Configuration</SelectItem>
              </SelectContent>
            </Select>
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

