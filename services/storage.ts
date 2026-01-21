
import { UserProfile, SaleEntry } from '../types';

const STORAGE_KEY = 'SDA_PRO_DATA';

interface AppData {
  profile: UserProfile | null;
  sales: SaleEntry[];
}

export const storage = {
  get: (): AppData => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { profile: null, sales: [] };
  },
  
  save: (data: AppData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
  
  exportData: () => {
    const data = storage.get();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SDA_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  },
  
  importData: (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.profile || data.sales) {
        storage.save(data);
        return true;
      }
    } catch (e) {
      console.error("Import failed", e);
    }
    return false;
  }
};
