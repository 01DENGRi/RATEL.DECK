// CVE Database with GitHub PoC links
// Uses backend server for persistence via /saveDatabase and /loadDatabase endpoints

export interface CVEEntry {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
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

/* ================= FILTERS ================= */

export const defaultOSFilters = ["Windows", "Linux", "macOS", "Unix", "Android", "iOS"];

export const defaultServiceFilters = [
  "SMB",
  "SSH",
  "FTP",
  "HTTP",
  "HTTPS",
  "RDP",
  "DNS",
  "LDAP",
  "Kerberos",
  "MySQL",
  "PostgreSQL",
  "Redis",
  "Docker",
];

/* ================= BACKEND CONFIG ================= */

const BACKEND_URL = "http://localhost:3001"; // Adjust if your backend runs on a different port

/* ================= DEFAULT CVES ================= */

const defaultCVEEntries: CVEEntry[] = [
  {
    id: "CVE-2021-44228",
    title: "Log4Shell - Apache Log4j RCE",
    description: "Apache Log4j2 JNDI feature allows remote code execution.",
    severity: "critical",
    cvss: 10.0,
    affectedProducts: ["Apache Log4j 2.x"],
    os: ["Linux", "Windows", "macOS"],
    services: ["HTTP", "LDAP"],
    publishedDate: "2021-12-10",
    pocs: [
      {
        name: "kozmer/log4j-shell-poc",
        url: "https://github.com/kozmer/log4j-shell-poc",
        language: "Python",
        stars: 1500,
      },
    ],
    references: ["https://nvd.nist.gov/vuln/detail/CVE-2021-44228"],
  },
];

/* ================= INTERNAL STATE ================= */

let cveDatabase: CVEEntry[] = [...defaultCVEEntries];

/* ================= SEARCH ================= */

export interface CVEFilters {
  os: string[];
  services: string[];
  yearFrom?: number;
  yearTo?: number;
}

export const searchCVE = (query: string, filters?: CVEFilters): CVEEntry[] => {
  let results = [...cveDatabase];
  const q = query.toLowerCase().trim();

  if (filters?.os.length) {
    results = results.filter((c) => c.os?.some((o) => filters.os.includes(o)));
  }

  if (filters?.services.length) {
    results = results.filter((c) => c.services?.some((s) => filters.services.includes(s)));
  }

  if (!q) return results;

  return results.filter(
    (c) =>
      c.id.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.affectedProducts.some((p) => p.toLowerCase().includes(q)),
  );
};

/* ================= CRUD ================= */

export const getAllCVEs = (): CVEEntry[] => [...cveDatabase];

export const getCVEById = (id: string) => cveDatabase.find((c) => c.id.toLowerCase() === id.toLowerCase());

export const addCVE = (cve: CVEEntry): boolean => {
  if (getCVEById(cve.id)) return false;
  // Ensure all optional arrays exist
  const normalizedCVE: CVEEntry = {
    ...cve,
    os: cve.os || [],
    services: cve.services || [],
    pocs: cve.pocs || [],
    references: cve.references || [],
    affectedProducts: cve.affectedProducts || [],
  };
  cveDatabase.push(normalizedCVE);
  return true;
};

export const updateCVE = (cve: CVEEntry): boolean => {
  const index = cveDatabase.findIndex((c) => c.id.toLowerCase() === cve.id.toLowerCase());
  if (index === -1) return false;

  // Ensure all optional arrays exist
  const normalizedCVE: CVEEntry = {
    ...cve,
    os: cve.os || [],
    services: cve.services || [],
    pocs: cve.pocs || [],
    references: cve.references || [],
    affectedProducts: cve.affectedProducts || [],
  };
  cveDatabase[index] = normalizedCVE;
  return true;
};

export const deleteCVE = (id: string): boolean => {
  const before = cveDatabase.length;
  cveDatabase = cveDatabase.filter((c) => c.id.toLowerCase() !== id.toLowerCase());
  return cveDatabase.length !== before;
};

/* ================= BACKEND SAVE / LOAD ================= */

export const saveDatabaseToServer = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    // Normalize all entries before sending
    const normalizedDatabase = cveDatabase.map((cve) => ({
      ...cve,
      os: cve.os || [],
      services: cve.services || [],
      pocs: cve.pocs || [],
      references: cve.references || [],
      affectedProducts: cve.affectedProducts || [],
    }));

    const response = await fetch(`${BACKEND_URL}/saveDatabase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalizedDatabase),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: errorText || `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
};

export const loadDatabaseFromServer = async (): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    const response = await fetch(`${BACKEND_URL}/loadDatabase`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, count: 0, error: errorText || `HTTP ${response.status}` };
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      return { success: false, count: 0, error: "Invalid format: expected array" };
    }

    // Normalize all entries
    cveDatabase = data.map((cve: CVEEntry) => ({
      ...cve,
      os: cve.os || [],
      services: cve.services || [],
      pocs: cve.pocs || [],
      references: cve.references || [],
      affectedProducts: cve.affectedProducts || [],
    }));

    return { success: true, count: cveDatabase.length };
  } catch (error) {
    return { success: false, count: 0, error: error instanceof Error ? error.message : "Network error" };
  }
};

/* ================= FILE IMPORT / EXPORT (for offline use) ================= */

export const exportDatabaseToFile = (): void => {
  const normalizedDatabase = cveDatabase.map((cve) => ({
    ...cve,
    os: cve.os || [],
    services: cve.services || [],
    pocs: cve.pocs || [],
    references: cve.references || [],
    affectedProducts: cve.affectedProducts || [],
  }));

  const blob = new Blob([JSON.stringify(normalizedDatabase, null, 2)], { type: "application/json" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cve-database.json";
  a.click();
  URL.revokeObjectURL(url);
};

export const importDatabaseFromFile = (file: File): Promise<{ success: boolean; count: number; error?: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!Array.isArray(parsed)) {
          resolve({ success: false, count: 0, error: "Invalid format" });
          return;
        }
        cveDatabase = parsed.map((cve: CVEEntry) => ({
          ...cve,
          os: cve.os || [],
          services: cve.services || [],
          pocs: cve.pocs || [],
          references: cve.references || [],
          affectedProducts: cve.affectedProducts || [],
        }));
        resolve({ success: true, count: parsed.length });
      } catch {
        resolve({ success: false, count: 0, error: "Invalid JSON" });
      }
    };
    reader.readAsText(file);
  });
};

export const mergeDatabaseFromFile = (file: File): Promise<{ success: boolean; added: number; skipped: number }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        let added = 0;
        let skipped = 0;

        parsed.forEach((c: CVEEntry) => {
          if (!getCVEById(c.id)) {
            const normalizedCVE: CVEEntry = {
              ...c,
              os: c.os || [],
              services: c.services || [],
              pocs: c.pocs || [],
              references: c.references || [],
              affectedProducts: c.affectedProducts || [],
            };
            cveDatabase.push(normalizedCVE);
            added++;
          } else {
            skipped++;
          }
        });

        resolve({ success: true, added, skipped });
      } catch {
        resolve({ success: false, added: 0, skipped: 0 });
      }
    };
    reader.readAsText(file);
  });
};

export const resetDatabaseToDefaults = (): void => {
  cveDatabase = [...defaultCVEEntries];
};

// Get all unique available CVE years
export const getAvailableYears = (): number[] => {
  const years = cveDatabase.map((cve) => parseInt(cve.publishedDate.split("-")[0], 10)).filter((year) => !isNaN(year));

  return Array.from(new Set(years)).sort((a, b) => b - a);
};
