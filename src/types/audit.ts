export type Recommendation = {
  priority: string;
  category: string;
  finding: string;
  fix: string;
  estimated_impact: string;
  effort: string;
  falsifiability_check: string;
};

export type AuditResult = {
  audit_version: string;
  overall_score: number;
  score_breakdown: {
    technical: number;
    on_page: number;
    content: number;
    core_web_vitals: number;
    schema: number;
  };
  critical_issues: string[];
  important_issues: string[];
  quick_wins: string[];
  recommendations: Recommendation[];
  executive_summary: string;
};

export type OnPageReport = {
  title: { text: string; length: number; present: boolean };
  metaDescription: { text: string; length: number; present: boolean };
  h1: { count: number; texts: string[] };
  h2: { count: number; texts: string[] };
  images: { total: number; missingAlt: number };
  wordCount: number;
  links: { internal: number; external: number };
  canonical: string | null;
  viewport: string | null;
  openGraph: { title: string | null; description: string | null; image: string | null };
  lang: string | null;
};

export type SchemaReport = {
  found: boolean;
  types: string[];
  valid: boolean;
  errors: string[];
};

export type TechnicalReport = {
  robotsFound: boolean;
  robotsBlocksAll: boolean;
  sitemapDeclared: boolean;
  sitemapFound: boolean;
  sitemapUrlCount: number;
  https: boolean;
};
