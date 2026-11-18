// Safe localStorage operations with error handling and logging

const isSensitiveKey = (key: string) => /token|auth|secret|password|jwt/i.test(key);

export const safeStorage = {
  getItem: (key: string, defaultValue: string | null = null): string | null => {
    try {
      const value = localStorage.getItem(key);
      return value;
    } catch (error) {
      console.error(`🔴 [STORAGE] Error getting item "${key}":`, error);
      return defaultValue;
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`🔴 [STORAGE] Error setting item "${key}":`, error);
      
      // Check if it's a quota exceeded error
      if (error instanceof DOMException) {
        if (error.name === 'QuotaExceededError' || error.code === 22) {
          console.error('🔴 [STORAGE] Storage quota exceeded. Consider clearing old data.');
        }
      }
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    try {
      console.log(`💾 [STORAGE] Removing item: ${key}`);
      localStorage.removeItem(key);
      console.log(`✅ [STORAGE] Successfully removed: ${key}`);
      return true;
    } catch (error) {
      console.error(`🔴 [STORAGE] Error removing item "${key}":`, error);
      return false;
    }
  },

  clear: (): boolean => {
    try {
      console.log('💾 [STORAGE] Clearing all storage');
      localStorage.clear();
      console.log('✅ [STORAGE] Successfully cleared all storage');
      return true;
    } catch (error) {
      console.error('🔴 [STORAGE] Error clearing storage:', error);
      return false;
    }
  },

  isAvailable: (): boolean => {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      console.log('✅ [STORAGE] localStorage is available');
      return true;
    } catch (error) {
      console.error('🔴 [STORAGE] localStorage is not available:', error);
      return false;
    }
  },

  getStorageInfo: (): { used: number; available: boolean } => {
    try {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
      
      const info = {
        used: total,
        available: true
      };
      
      console.log('📊 [STORAGE] Storage info:', {
        usedBytes: total,
        usedKB: (total / 1024).toFixed(2),
        usedMB: (total / 1024 / 1024).toFixed(2),
      });
      
      return info;
    } catch (error) {
      console.error('🔴 [STORAGE] Error getting storage info:', error);
      return { used: 0, available: false };
    }
  }
};

// Log storage availability on module load
console.log('🔧 [STORAGE] Initializing safe storage module');
if (typeof window !== 'undefined') {
  safeStorage.isAvailable();
  safeStorage.getStorageInfo();
}
