import type { StudentData } from '../types';

const STORAGE_KEY = 'student-data';

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

  clearData: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      throw error;
    }
  },

  exportData: (): void => {
    try {
      const data = storageService.getData();
      if (!data) {
        throw new Error('No data to export');
      }

      const dataStr = JSON.stringify(data, null, 2);
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

