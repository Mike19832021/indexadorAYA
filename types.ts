export interface LogFile {
  id: string;
  name: string;
  content: string;
  size: number;
  originalArchive: string;
}

export interface SearchResult {
  fileId: string;
  fileName: string;
  lineContent: string;
  lineNumber: number;
  matchIndex: number;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  ERROR = 'ERROR'
}

export interface AIAnalysisResult {
  summary: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendations: string[];
}