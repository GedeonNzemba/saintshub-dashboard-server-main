// PATH: saintshub\app\(app)\components\sermon\hooks\useSermonData.ts
// sermon/hooks/useSermonData.ts
import { useQuery, useInfiniteQuery, QueryClient, InfiniteData } from '@tanstack/react-query';
import axios from 'axios';
import { DAILY_SCRIPTURE_AND_QUOTE_URI } from '@/utilities/tools'; // Added import
import { Sermon, Language } from '../types';

// API base URL for sermon endpoints
const API_BASE_URL = `${DAILY_SCRIPTURE_AND_QUOTE_URI}/api/v3`;

// --- Language Fetching ---
const fetchLanguages = async (): Promise<Language[]> => {
  console.log('[useSermonData] Fetching languages from:', `${API_BASE_URL}/languages`);
  const response = await axios.get<any>(`${API_BASE_URL}/languages`); // Expecting { d: [langObj, ...] }
  const rawData = response.data;
  console.log('[useSermonData] Raw languages API response:', rawData);

  if (!rawData || !Array.isArray(rawData.d)) {
    console.error('[useSermonData] Unexpected languages API response structure:', rawData);
    throw new Error('Unexpected languages API response structure');
  }

  // The server returns languages in the 'd' property
  const languagesArray = rawData.d;
  
  // Transform the data to match our Language type
  const processedLanguages: Language[] = languagesArray.map((lang: any) => {
    return {
      id: lang.id || lang.code, // Ensure id exists, fallback to code
      code: lang.code,
      name: lang.name,
      englishName: lang.englishName || lang.name, // Fallback if englishName not present
      nativeName: lang.nativeName || lang.name, // Fallback if nativeName not present
      // numericId: lang.numericId || (lang.code === 'fr' ? '6' : 'some_default_numeric_id'), // Example logic from old hook
    };
  });
  console.log('[useSermonData] Processed languages:', processedLanguages);
  return processedLanguages;
};

export const useLanguages = () => {
  return useQuery<Language[], Error>({
    queryKey: ['sermonLanguages'], // Changed queryKey to avoid conflict if 'languages' is used elsewhere
    queryFn: fetchLanguages,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

// --- Sermon Fetching ---
interface PaginatedSermonsResponse {
  sermons: Sermon[];
  nextPage: number | null; // Next page number, or null if no more pages
  totalSermons?: number;   // Optional: total count of sermons for the query
}

interface FetchSermonsParams {
  pageParam?: number;
  languageCode?: string | null; // Made optional, enabled flag in useSermons handles fetch logic
  yearCode?: string;
  seriesCode?: string;
  lengthCode?: string;
  searchQuery?: string;
}

const SERMONS_PER_PAGE = 10;

const fetchSermons = async ({ pageParam = 1, ...params }: FetchSermonsParams & { pageParam?: number }): Promise<PaginatedSermonsResponse> => {
  // console.log('[useSermonData] Fetching sermons with params:', params);
  let baseEndpoint = `${API_BASE_URL}/sermons`;
  const queryParams = new URLSearchParams();

  if (params.languageCode) {
    queryParams.append('languageCode', params.languageCode);
  }

  if (params.searchQuery) {
    baseEndpoint = `${API_BASE_URL}/searchSermons`;
    queryParams.append('key', params.searchQuery);
    // Search is exclusive for now; other filters are ignored if searchQuery is present.
  } else {
    // Determine endpoint based on filter priority: Length > Series > Year
    if (params.lengthCode) {
      baseEndpoint = `${API_BASE_URL}/sermonsByLength`;
    } else if (params.seriesCode) {
      baseEndpoint = `${API_BASE_URL}/sermonsBySeries`;
    } else if (params.yearCode) {
      baseEndpoint = `${API_BASE_URL}/sermonsByYear`;
    }
    // If none of these specific filters are present, baseEndpoint remains /sermons

    // Append all active filters to the chosen endpoint
    if (params.yearCode) {
      queryParams.append('yearCode', params.yearCode);
    }
    if (params.seriesCode) {
      queryParams.append('seriesCode', params.seriesCode);
    }
    if (params.lengthCode) {
      queryParams.append('lengthCode', params.lengthCode);
    }
  }

  queryParams.append('page', pageParam.toString());
  queryParams.append('limit', SERMONS_PER_PAGE.toString());

  const finalUrl = `${baseEndpoint}?${queryParams.toString()}`;
  // console.log('[useSermonData] Final fetch URL:', finalUrl);

  const { data: rawData } = await axios.get<any>(finalUrl);
  console.log('[useSermonData] Raw data from API (' + finalUrl + '):', JSON.stringify(rawData, null, 2)); // Log raw data

  // The sermon data is wrapped in a 'd' property in the API response.
  const sermonArray = rawData.d || [];

  const transformedSermons = sermonArray.map((sermon: any) => ({
    id: sermon.code, // The unique identifier is 'code'
    title: sermon.title,
    speakerName: sermon.location, // Assuming 'location' is the speaker/location info
    seriesTitle: sermon.seriesTitle, // Not available in this endpoint
    dateRecorded: sermon.dateRecorded, // Not available in this endpoint
    durationDisplay: sermon.duration,
    audioUrl: sermon.audioUrl,
    pdfUrl: sermon.pdfUrl,
    // Fields not present in this specific endpoint will be undefined
    languageCode: params.languageCode,
    year: sermon.year,
    code: sermon.code, // Ensure 'code' is mapped for display
  }));

  const response: PaginatedSermonsResponse = {
    sermons: transformedSermons,
    nextPage: rawData.nextPage, // Pagination info is at the root
    totalSermons: rawData.totalSermons,
  };

  // console.log('[useSermonData] Sermons fetched and transformed (page ${pageParam}):', response);
  return response;
};

export const useSermons = (params: FetchSermonsParams = {}) => {
  return useInfiniteQuery<
    PaginatedSermonsResponse, // Type of data fetched per page
    Error,                    // Error type
    InfiniteData<PaginatedSermonsResponse>, // Type of the entire dataset
    (string | FetchSermonsParams)[], // QueryKey type
    number                    // PageParam type
  >({
    queryKey: ['sermons', params],
    queryFn: ({ pageParam }) => fetchSermons({ ...params, pageParam }),
    enabled: !!params.languageCode && typeof params.languageCode === 'string' && params.languageCode.length > 0, // Only fetch if languageCode is a valid string
    getNextPageParam: (lastPage) => {
      // lastPage is of type PaginatedSermonsResponse
      return lastPage.nextPage; // Return nextPage value, or undefined/null if no more pages
    },
    initialPageParam: 1, // Start fetching from page 1
    staleTime: 1000 * 60 * 5, // 5 minutes, adjust as needed
    // Add other react-query options as needed
  });
};

// --- Prefetching (Example) ---
// You might want to prefetch common data, e.g., default language sermons
export const prefetchSermonsForLanguage = async (queryClient: QueryClient, languageCode: string) => {
  // console.log(`[useSermonData] Prefetching sermons for language: ${languageCode}`);
  await queryClient.prefetchQuery({
    queryKey: ['sermons', { languageCode }],
    queryFn: () => fetchSermons({ languageCode, pageParam: 1 }), // Fetch first page for prefetch
    staleTime: 1000 * 60 * 30,
  });
  // console.log(`[useSermonData] Prefetching complete for language: ${languageCode}`);
};

export const prefetchLanguages = async (queryClient: QueryClient) => {
  // console.log('[useSermonData] Prefetching languages...');
  await queryClient.prefetchQuery({
    queryKey: ['languages'],
    queryFn: fetchLanguages,
    staleTime: 1000 * 60 * 60 * 24,
  });
  // console.log('[useSermonData] Languages prefetching complete.');
};

// You can add more specific hooks like useSermonsByYear, useSermonsBySeries etc.
// or expand fetchSermons and useSermons to handle more complex filtering.
