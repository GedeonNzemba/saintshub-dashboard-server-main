// Type definitions for sermon components

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
}

export interface Language {
  id: string;
  code: string;
  name: string;
  flag?: string;
}

export interface PdfViewerProps {
  pdfUrl: string;
  sermonTitle?: string;
  isDarkMode?: boolean;
}
