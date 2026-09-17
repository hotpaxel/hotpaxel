// Status of the HOT SDK internal state machine
export enum SdkStatus {
  IDLE = 'IDLE',
  SYNCING = 'SYNCING', // Translating HTML <-> TeX
  SUCCESS = 'SUCCESS', // Round-trip verification passed
  FAILURE = 'FAILURE', // Round-trip verification failed (TeX syntax error or protection violation)
}

// Represents the "Protected Tokens" that cannot be partially edited
export type ProtectedTokenType = 'variable' | 'logic' | 'signbox' | 'clauseref' | 'party' | 'meta';

export interface HotTokenData {
  type: ProtectedTokenType;
  value: string;
}

export interface Asset {
  name: string;
  content: string; // Base64 encoded content
}

// Structure of the document state managed by HOT SDK
export interface HotDocumentState {
  html: string;
  tex: string;
  assets: Asset[];
  requiredFonts: string[]; // List of unique font families used in the document
  lastUpdated: Date;
  version: number;
}

export interface StatusPanelProps {
  status: SdkStatus;
  version: number;
  errorMessage?: string;
  lastSynced?: Date;
  onNew: () => void;
  onSave: () => void;
  onLoad: (event: React.ChangeEvent<HTMLInputElement>) => void;
  paxelEndpoint: string;
  onEndpointChange: (endpoint: string) => void;
}

export interface FontInfo {
  family: string;
  styles: string[];
  fileName: string;
  raw?: string;
}

export interface PdfPreviewProps {
  pdfUrl: string | null;
  isLoading: boolean;
  error: string | null;
  durationMs?: number | null;
  onRefresh: () => void;
}
