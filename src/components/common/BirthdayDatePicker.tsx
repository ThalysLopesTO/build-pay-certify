import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BirthdayDatePickerProps {
  value: Date | null | undefined;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const BirthdayDatePicker: React.FC<BirthdayDatePickerProps> = ({ value, onChange, disabled = false }) => {
  const currentYear = new Date().getFullYear();
  const startYear = 1940;

  // Generate years from current year down to startYear
  const years = useMemo(() => {
    const arr = [];
    for (let y = currentYear; y >= startYear; y--) {
      arr.push(y);
    }
    return arr;
  }, [currentYear]);

  // Get days in month accounting for leap years
  const getDaysInMonth = (month: number, year: number): number => {
    if (month === 0) return 31; // Jan
    if (month === 1) { // Feb - check leap year
      if ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)) {
        return 29;
      }
      return 28;
    }
    if (month === 2) return 31; // Mar
    if (month === 3) return 30; // Apr
    if (month === 4) return 31; // May
    if (month === 5) return 30; // Jun
    if (month === 6) return 31; // Jul
    if (month === 7) return 31; // Aug
    if (month === 8) return 30; // Sep
    if (month === 9) return 31; // Oct
    if (month === 10) return 30; // Nov
    return 31; // Dec
  };

  // Extract current values from the date
  const selectedMonth = value ? value.getMonth() : null;
  const selectedDay = value ? value.getDate() : null;
  const selectedYear = value ? value.getFullYear() : null;

  // Calculate available days based on selected month and year
  const availableDays = useMemo(() => {
    const month = selectedMonth ?? 0;
    const year = selectedYear ?? currentYear;
    const maxDays = getDaysInMonth(month, year);
    const arr = [];
    for (let d = 1; d <= maxDays; d++) {
      arr.push(d);
    }
    return arr;
  }, [selectedMonth, selectedYear, currentYear]);

  const handleMonthChange = (monthStr: string) => {
    const month = parseInt(monthStr, 10);
    const year = selectedYear ?? currentYear;
    let day = selectedDay ?? 1;
    
    // Adjust day if it exceeds the max days in the new month
    const maxDays = getDaysInMonth(month, year);
    if (day > maxDays) {
      day = maxDays;
    }
    
    // Use noon to prevent timezone shift issues
    onChange(new Date(year, month, day, 12, 0, 0));
  };

  const handleDayChange = (dayStr: string) => {
    const day = parseInt(dayStr, 10);
    const month = selectedMonth ?? 0;
    const year = selectedYear ?? currentYear;
    // Use noon to prevent timezone shift issues
    onChange(new Date(year, month, day, 12, 0, 0));
  };

  const handleYearChange = (yearStr: string) => {
    const year = parseInt(yearStr, 10);
    const month = selectedMonth ?? 0;
    let day = selectedDay ?? 1;
    
    // Adjust day if it exceeds the max days (e.g., Feb 29 on non-leap year)
    const maxDays = getDaysInMonth(month, year);
    if (day > maxDays) {
      day = maxDays;
    }
    
    // Use noon to prevent timezone shift issues
    onChange(new Date(year, month, day, 12, 0, 0));
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
      {/* Month Select */}
      <Select
        value={selectedMonth !== null ? selectedMonth.toString() : ''}
        onValueChange={handleMonthChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full sm:w-[140px] h-10">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent className="max-h-[280px]">
          {MONTHS.map((month, index) => (
            <SelectItem key={month} value={index.toString()}>
              {month}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Day Select */}
      <Select
        value={selectedDay !== null ? selectedDay.toString() : ''}
        onValueChange={handleDayChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full sm:w-[90px] h-10">
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent className="max-h-[280px]">
          {availableDays.map((day) => (
            <SelectItem key={day} value={day.toString()}>
              {day}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Year Select */}
      <Select
        value={selectedYear !== null ? selectedYear.toString() : ''}
        onValueChange={handleYearChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full sm:w-[100px] h-10">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent className="max-h-[280px]">
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default BirthdayDatePicker;
