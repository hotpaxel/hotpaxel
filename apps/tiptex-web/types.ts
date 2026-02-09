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

// Structure of the document state managed by HOT SDK
export interface HotDocumentState {
  html: string;
  tex: string;
  lastUpdated: Date;
  version: number;
}

// Props for the internal Status Panel
export interface StatusPanelProps {
  status: SdkStatus;
  errorMessage?: string;
  lastSynced?: Date;
}

export interface PdfPreviewProps {
  pdfUrl: string | null;
  isLoading: boolean;
  onRefresh: () => void;
}
