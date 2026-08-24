export type ProductContext = {
  partCode: string;
  serialNumber: string;
};

export type PhotoAlbum = { nome: string; quantidadeFotos: number };

export type MediaAsset = {
  path: string;
  physicalName: string;
  originalName?: string;
  type?: 'IMAGE' | 'VIDEO';
  mimeType?: string;
};

export type ProductionHistoryRecord = {
  _id: string;
  code?: string;
  appName?: string;
  pn?: string;
  serialNumber?: string;
  productionId?: string;
  codItem?: string;
  gate?: string;
  featureColumn: 'MONTAGEM' | 'QUALIDADE' | 'INSPECAO';
  status: 'UPLOADED' | 'FAILED';
  attempts?: number;
  media: MediaAsset[];
};

export type PaginatedReports = {
  items: ProductionHistoryRecord[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type InspectionFailure = Record<string, unknown>;

export type HistoryRow = {
  id: string;
  record: ProductionHistoryRecord;
  media?: MediaAsset;
};
