// CVE Types - Shared between cveDatabase and cveFileStorage

export interface CVEEntry {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvss?: number;
  affectedProducts: string[];
  publishedDate: string;
  os?: string[];
  services?: string[];
  pocs: {
    name: string;
    url: string;
    language?: string;
    stars?: number;
  }[];
  references: string[];
}

export interface CVEDatabaseFile {
  version: string;
  lastModified: string;
  customCVEs: CVEEntry[];
}
