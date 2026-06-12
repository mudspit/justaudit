export interface AuditScore {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  label: string;
}

export interface Issue {
  type: 'error' | 'warning' | 'info' | 'pass';
  title: string;
  description: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
}

export interface SEOAudit {
  score: AuditScore;
  issues: Issue[];
  meta: {
    title: string | null;
    titleLength: number;
    description: string | null;
    descriptionLength: number;
    canonical: string | null;
    robots: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
  };
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  images: {
    total: number;
    missingAlt: number;
    emptyAlt: number;
  };
  links: {
    internal: number;
    external: number;
    broken: number;
  };
  technical: {
    httpsEnabled: boolean;
    wwwRedirect: boolean | null;
    pageSpeedScore: number | null;
    mobileScore: number | null;
    coreWebVitals: {
      lcp: number | null;
      fid: number | null;
      cls: number | null;
    };
  };
}

export interface AEOAudit {
  score: AuditScore;
  issues: Issue[];
  structuredData: {
    schemas: string[];
    hasFAQ: boolean;
    hasHowTo: boolean;
    hasSpeakable: boolean;
    hasArticle: boolean;
    hasBreadcrumb: boolean;
    hasProduct: boolean;
    hasReview: boolean;
    hasOrganization: boolean;
    raw: object[];
  };
  featuredSnippetReadiness: {
    hasDirectAnswers: boolean;
    hasListContent: boolean;
    hasTableContent: boolean;
    questionPhrasing: number;
  };
  voiceSearchReadiness: {
    hasConversationalContent: boolean;
    hasSpeakableSchema: boolean;
    localBusinessMarkup: boolean;
  };
}

export interface GEOAudit {
  score: AuditScore;
  issues: Issue[];
  eatSignals: {
    hasAuthorInfo: boolean;
    hasDatePublished: boolean;
    hasCitations: boolean;
    hasAboutPage: boolean;
    hasContactPage: boolean;
    hasPrivacyPolicy: boolean;
  };
  contentQuality: {
    wordCount: number;
    readabilityScore: string;
    hasStatistics: boolean;
    hasQuotes: boolean;
    hasSources: boolean;
  };
  aiCitationReadiness: {
    hasEntityMarkup: boolean;
    hasFactualStatements: boolean;
    hasWikipediaLinks: boolean;
    contentStructureScore: number;
    uniqueValueProposition: boolean;
  };
  entityClarity: {
    brandNameConsistency: boolean;
    topicFocusScore: number;
    semanticKeywords: string[];
  };
}

export interface AuditResult {
  url: string;
  domain: string;
  auditDate: string;
  overallScore: AuditScore;
  seo: SEOAudit;
  aeo: AEOAudit;
  geo: GEOAudit;
  pageTitle: string;
  pageSpeed: PageSpeedResult | null;
}

export interface PageSpeedResult {
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  seoScore: number;
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
}
