import type { StudentData, Year } from '../types';

export const STORAGE_KEY = 'student-data';
/** The year this device shows. It belongs to the device: other devices never see or move it. */
export const SELECTED_YEAR_KEY = 'selected-year';
/** The one version this device can go back to, see utils/backup.ts. */
export const BACKUP_KEY = 'data-backup';

export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const parseSelectedYear = (stored: string | null): Year | null => {
  const year = Number(stored);
  return year === 1 || year === 2 || year === 3 || year === 4 ? year : null;
};

export const storageService = {
  getData: (): StudentData | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  saveData: (data: StudentData): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  getSelectedYear: (): Year | null => {
    try {
      return parseSelectedYear(localStorage.getItem(SELECTED_YEAR_KEY));
    } catch {
      return null;
    }
  },

  saveSelectedYear: (year: Year): void => {
    try {
      localStorage.setItem(SELECTED_YEAR_KEY, String(year));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  clearData: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SELECTED_YEAR_KEY);
      localStorage.removeItem(BACKUP_KEY);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      throw error;
    }
  },

  /** The text of an export file. Files keep the selected year, in the field they always had it in. */
  exportText: (): string => {
    const data = storageService.getData();
    if (!data) {
      throw new Error('No data to export');
    }
    return JSON.stringify({ ...data, currentYear: storageService.getSelectedYear() ?? data.currentYear }, null, 2);
  },

  exportData: (): void => {
    try {
      const dataStr = storageService.exportText();
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `student-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  },

  importData: (file: File): Promise<StudentData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          if (!e.target || !e.target.result) {
            reject(new Error('Failed to read file'));
            return;
          }
          const text = e.target.result as string;
          if (!text || typeof text !== 'string') {
            reject(new Error('Failed to read file'));
            return;
          }
          
          const data = JSON.parse(text) as StudentData;
          
          // Basic validation
          if (!data || typeof data !== 'object') {
            reject(new Error('Invalid data format'));
            return;
          }
          
          // Validate required fields
          if (!data.years || typeof data.years !== 'object') {
            reject(new Error('Invalid data format: missing years'));
            return;
          }
          
          resolve(data);
        } catch (error) {
          console.error('Error parsing imported data:', error);
          reject(new Error('Failed to parse JSON file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }
};

