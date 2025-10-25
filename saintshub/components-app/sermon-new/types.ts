// Type definitions for sermon-new components

export interface Language {
  id: string;
  code: string;
  name: string;
  flag?: string;
  sermonCount?: number;
}

export interface Sermon {
  _id: string;
  title: string;
  code: string;
  speaker: string;
  date: string;
  location: string;
  duration: string;
  audioUrl: string;
  pdfUrl: string;
  streamUrl: string;
  language?: string;
  year?: string;
  length?: 'SHORT' | 'MEDIUM' | 'LONG';
  series?: string;
  openPdf?: boolean;
}

export interface SermonFormat {
  sermons: Sermon[];
}

export interface LanguageSermonData {
  audio?: SermonFormat;
  book?: SermonFormat;
}

export interface SermonsResponse {
  sermons?: Sermon[];
  d?: Sermon[];
  [languageCode: string]: LanguageSermonData | Sermon[] | undefined;
}

export type FilterType = 'language' | 'year' | 'length' | 'series' | 'search';

export interface FilterState {
  year: string | null;
  length: string | null;
  series: string | null;
}
