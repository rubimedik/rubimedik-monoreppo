import { format, isValid } from 'date-fns';

/**
 * Safely formats a date, returning a fallback string if the date is invalid or null.
 * Prevents "Invalid time value" crashes.
 */
export const safeFormat = (date: any, formatStr: string, fallback: string = 'N/A'): string => {
  if (!date) return fallback;
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    
    if (!isValid(dateObj)) {
      return fallback;
    }
    
    return format(dateObj, formatStr);
  } catch (error) {
    console.warn('SafeFormat encountered an error:', error);
    return fallback;
  }
};
