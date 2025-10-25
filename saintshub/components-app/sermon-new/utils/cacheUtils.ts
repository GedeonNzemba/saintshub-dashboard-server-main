// PATH: saintshub\app\(app)\components\sermon-new\utils\cacheUtils.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { DAILY_SCRIPTURE_AND_QUOTE_URI } from '@/utilities/tools';

// Cache time constants
const CACHE_TIME_MS = 1000 * 60 * 60 * 24; // 24 hours
const STALE_TIME_MS = 1000 * 60 * 60; // 1 hour

/**
 * Get cached data if it exists and is not stale
 * @param cacheKey Key to look up in cache
 * @returns Cached data or null if not found/stale
 */
export const getFromCache = async (cacheKey: string) => {
  try {
    const cachedData = await AsyncStorage.getItem(cacheKey);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const now = new Date().getTime();
      
      // If cache is fresh enough, return it
      if (now - timestamp < STALE_TIME_MS) {
        console.log(`Using cached data for ${cacheKey}`);
        return data;
      }
    }
    return null;
  } catch (error) {
    console.log(`Error reading from cache for ${cacheKey}:`, error);
    return null;
  }
};

/**
 * Save data to cache with current timestamp
 * @param cacheKey Key to store data under
 * @param data Data to cache
 */
export const saveToCache = async (cacheKey: string, data: any) => {
  try {
    await AsyncStorage.setItem(
      cacheKey,
      JSON.stringify({
        data,
        timestamp: new Date().getTime()
      })
    );
    console.log(`Saved data to cache: ${cacheKey}`);
  } catch (error) {
    console.log(`Error saving to cache for ${cacheKey}:`, error);
  }
};

/**
 * Clear cached sermon data that is older than the specified age
 * @param maxAgeMs Maximum age of cache entries in milliseconds (default: 7 days)
 */
export const clearOldSermonCaches = async (maxAgeMs = 1000 * 60 * 60 * 24 * 7) => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const sermonKeys = keys.filter(key => 
      key.startsWith('sermons_') || 
      key.startsWith('sermon_stream_')
    );
    
    console.log(`Found ${sermonKeys.length} sermon cache entries`);
    let clearedCount = 0;
    
    for (const key of sermonKeys) {
      try {
        const cachedData = await AsyncStorage.getItem(key);
        if (cachedData) {
          const { timestamp } = JSON.parse(cachedData);
          const now = new Date().getTime();
          
          // Clear caches older than the specified age
          if (now - timestamp > maxAgeMs) {
            await AsyncStorage.removeItem(key);
            clearedCount++;
          }
        }
      } catch (error) {
        console.error(`Error processing cache entry ${key}:`, error);
      }
    }
    
    console.log(`Cleared ${clearedCount} old sermon cache entries`);
    return { clearedCount, totalCount: sermonKeys.length };
  } catch (error) {
    console.error("Error clearing old caches:", error);
    return { clearedCount: 0, totalCount: 0, error };
  }
};

/**
 * Clear all sermon caches regardless of age
 */
export const clearAllSermonCaches = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const sermonKeys = keys.filter(key => 
      key.startsWith('sermons_') || 
      key.startsWith('sermon_stream_')
    );
    
    if (sermonKeys.length > 0) {
      await AsyncStorage.multiRemove(sermonKeys);
    }
    
    console.log(`Cleared all ${sermonKeys.length} sermon cache entries`);
    return { clearedCount: sermonKeys.length };
  } catch (error) {
    console.error("Error clearing all sermon caches:", error);
    return { clearedCount: 0, error };
  }
};

/**
 * Get information about sermon cache size and count
 */
export const getSermonCacheInfo = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const sermonKeys = keys.filter(key => 
      key.startsWith('sermons_') || 
      key.startsWith('sermon_stream_')
    );
    
    let totalSizeBytes = 0;
    const cacheTypes = {
      byYear: 0,
      byLength: 0,
      bySeries: 0,
      stream: 0,
      other: 0
    };
    
    for (const key of sermonKeys) {
      try {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          totalSizeBytes += item.length * 2; // Rough estimate in bytes
          
          // Count by type
          if (key.includes('_year_')) {
            cacheTypes.byYear++;
          } else if (key.includes('_length_')) {
            cacheTypes.byLength++;
          } else if (key.includes('_series_')) {
            cacheTypes.bySeries++;
          } else if (key.includes('_stream_')) {
            cacheTypes.stream++;
          } else {
            cacheTypes.other++;
          }
        }
      } catch (error) {
        console.error(`Error measuring cache entry ${key}:`, error);
      }
    }
    
    return {
      count: sermonKeys.length,
      sizeKB: Math.round(totalSizeBytes / 1024),
      sizeMB: Math.round(totalSizeBytes / (1024 * 1024) * 100) / 100,
      types: cacheTypes
    };
  } catch (error) {
    console.error("Error calculating cache info:", error);
    return { 
      count: 0, 
      sizeKB: 0, 
      sizeMB: 0,
      types: { byYear: 0, byLength: 0, bySeries: 0, stream: 0, other: 0 },
      error
    };
  }
};

// Direct API call functions with caching

/**
 * Fetch sermons by language with caching
 */
export const fetchSermonsByLanguageWithCache = async (languageCode: string) => {
  if (!languageCode) {
    throw new Error('Language code is required');
  }
  
  // Create cache key
  const cacheKey = `sermons_language_${languageCode}`;
  
  // Try to get from cache first
  const cachedData = await getFromCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  // Fetch from API if no cache hit
  console.log(`Fetching sermons for language: ${languageCode}`);
  try {
    const response = await axios.get(`${DAILY_SCRIPTURE_AND_QUOTE_URI}/api/v3/sermons?languageCode=${languageCode}`);
    console.log('Sermons response:', response.data);
    
    // Save to cache
    await saveToCache(cacheKey, response.data);
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch sermons:', error);
    throw error;
  }
};

/**
 * Fetch sermons by year with caching
 * Fixed to use correct API format without hyphens
 */
export const fetchSermonsByYearWithCache = async (languageCode: string, yearCode: string) => {
  if (!languageCode || !yearCode) {
    throw new Error('Language code and year code are required');
  }
  
  // Remove any hyphens from the year code to fix API errors
  const cleanYearCode = yearCode.replace('-', '');
  
  // Create cache key
  const cacheKey = `sermons_year_${languageCode}_${cleanYearCode}`;
  
  // Try to get from cache first
  const cachedData = await getFromCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  // Fetch from API if no cache hit
  const url = `${DAILY_SCRIPTURE_AND_QUOTE_URI}/api/v3/sermonsByYear?languageCode=${languageCode}&yearCode=${cleanYearCode}`;
  console.log(`Fetching sermons by year:`, { languageCode, url, yearCode: cleanYearCode });
  
  try {
    const response = await axios.get(url);
    console.log('Sermons by year response:', response.data);
    
    // Save to cache
    await saveToCache(cacheKey, response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch sermons by year:', error);
    throw new Error(`Failed to fetch sermons by year: ${error.response?.status || error.message}`);
  }
};

/**
 * Fetch sermons by length with caching
 */
export const fetchSermonsByLengthWithCache = async (languageCode: string, lengthCode: string) => {
  if (!languageCode || !lengthCode) {
    throw new Error('Language code and length code are required');
  }
  
  // Create cache key
  const cacheKey = `sermons_length_${languageCode}_${lengthCode}`;
  
  // Try to get from cache first
  const cachedData = await getFromCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  // Fetch from API if no cache hit
  console.log(`Fetching sermons for language: ${languageCode}, length: ${lengthCode}`);
  try {
    const response = await axios.get(`${DAILY_SCRIPTURE_AND_QUOTE_URI}/api/v3/sermonsByLength?languageCode=${languageCode}&lengthCode=${lengthCode}`);
    console.log('Sermons by length response:', response.data);
    
    // Save to cache
    await saveToCache(cacheKey, response.data);
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch sermons by length:', error);
    throw error;
  }
};

/**
 * Fetch sermons by series with caching
 */
export const fetchSermonsBySeriesWithCache = async (languageCode: string, seriesCode: string) => {
  if (!languageCode || !seriesCode) {
    throw new Error('Language code and series code are required');
  }
  
  // Create cache key
  const cacheKey = `sermons_series_${languageCode}_${seriesCode}`;
  
  // Try to get from cache first
  const cachedData = await getFromCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  // Fetch from API if no cache hit
  console.log(`Fetching sermons for language: ${languageCode}, series: ${seriesCode}`);
  try {
    const response = await axios.get(`${DAILY_SCRIPTURE_AND_QUOTE_URI}/api/v3/sermonsBySeries?languageCode=${languageCode}&seriesCode=${seriesCode}`);
    console.log('Sermons by series response:', response.data);
    
    // Save to cache
    await saveToCache(cacheKey, response.data);
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch sermons by series:', error);
    throw error;
  }
};

/**
 * Prefetch common sermon data to improve initial load experience
 * @param languages Array of language codes to prefetch
 */
export const prefetchCommonSermonData = async (languages: string[] = []) => {
  try {
    console.log('Prefetching common sermon data...');
    
    // If no languages provided, use default languages
    const languagesToPrefetch = languages.length > 0 
      ? languages 
      : ['en', 'es', 'fr']; // Default to most common languages
    
    const prefetchPromises = [];
    
    // Prefetch sermons for each language
    for (const languageCode of languagesToPrefetch) {
      // Only prefetch if not already in cache
      const cacheKey = `sermons_language_${languageCode}`;
      const cachedData = await getFromCache(cacheKey);
      
      if (!cachedData) {
        prefetchPromises.push(
          fetchSermonsByLanguageWithCache(languageCode)
            .catch(error => console.error(`Failed to prefetch sermons for language ${languageCode}:`, error))
        );
      }
      
      // Prefetch most popular year (e.g., 1963)
      // Updated to use correct format without hyphen
      const yearCacheKey = `sermons_year_${languageCode}_63`;
      const yearCachedData = await getFromCache(yearCacheKey);
      
      if (!yearCachedData) {
        prefetchPromises.push(
          fetchSermonsByYearWithCache(languageCode, '63')
            .catch(error => console.error(`Failed to prefetch sermons for year 1963 in ${languageCode}:`, error))
        );
      }
    }
    
    // Wait for all prefetch operations to complete
    if (prefetchPromises.length > 0) {
      await Promise.all(prefetchPromises);
      console.log('Prefetching completed successfully');
    } else {
      console.log('All common data already cached, skipping prefetch');
    }
    
    return { success: true, prefetchedCount: prefetchPromises.length };
  } catch (error) {
    console.error('Error during prefetch operation:', error);
    return { success: false, error };
  }
};
