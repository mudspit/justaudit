import { AuditResult } from '@/types/audit';

export async function downloadXLS(audit: AuditResult) {
  const XLSX = await import('xlsx');

  const wb = XLSX.utils.book_new();

  // ── Summary Sheet ──
  const summaryData = [
    ['WebAudit Pro — Website Audit Report'],
    ['URL', audit.url],
    ['Domain', audit.domain],
    ['Audit Date', new Date(audit.auditDate).toLocaleString()],
    ['Page Title', audit.pageTitle],
    [],
    ['CATEGORY', 'SCORE', 'GRADE'],
    ['Overall', audit.overallScore.score, audit.overallScore.grade],
    ['SEO', audit.seo.score.score, audit.seo.score.grade],
    ['AEO (Answer Engine)', audit.aeo.score.score, audit.aeo.score.grade],
    ['GEO (Generative Engine)', audit.geo.score.score, audit.geo.score.grade],
    [],
    ['Core Web Vitals'],
    ['Performance Score', audit.pageSpeed?.performanceScore ?? 'N/A'],
    ['Accessibility Score', audit.pageSpeed?.accessibilityScore ?? 'N/A'],
    ['Best Practices Score', audit.pageSpeed?.bestPracticesScore ?? 'N/A'],
    ['SEO Score (Lighthouse)', audit.pageSpeed?.seoScore ?? 'N/A'],
    ['LCP (s)', audit.pageSpeed?.lcp ? (audit.pageSpeed.lcp / 1000).toFixed(2) : 'N/A'],
    ['FCP (s)', audit.pageSpeed?.fcp ? (audit.pageSpeed.fcp / 1000).toFixed(2) : 'N/A'],
    ['CLS', audit.pageSpeed?.cls !== null ? audit.pageSpeed?.cls?.toFixed(3) : 'N/A'],
    ['TTFB (ms)', audit.pageSpeed?.ttfb ? Math.round(audit.pageSpeed.ttfb) : 'N/A'],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // ── Issues helper ──
  function issuesSheet(issues: AuditResult['seo']['issues'], name: string) {
    const data = [
      ['Status', 'Title', 'Description', 'Impact', 'Recommendation'],
      ...issues.map(i => [
        i.type.toUpperCase(),
        i.title,
        i.description,
        i.impact.toUpperCase(),
        i.recommendation,
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 10 }, { wch: 40 }, { wch: 55 }, { wch: 10 }, { wch: 65 }];
    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  issuesSheet(audit.seo.issues, 'SEO Issues');
  issuesSheet(audit.aeo.issues, 'AEO Issues');
  issuesSheet(audit.geo.issues, 'GEO Issues');

  // ── SEO Meta Sheet ──
  const seoMetaData = [
    ['SEO Technical Details'],
    [],
    ['META DATA', 'VALUE'],
    ['Page Title', audit.seo.meta.title ?? '—'],
    ['Title Length', audit.seo.meta.titleLength],
    ['Meta Description', audit.seo.meta.description ?? '—'],
    ['Description Length', audit.seo.meta.descriptionLength],
    ['Canonical URL', audit.seo.meta.canonical ?? '—'],
    ['Robots Meta', audit.seo.meta.robots ?? '—'],
    ['OG Title', audit.seo.meta.ogTitle ?? '—'],
    ['OG Description', audit.seo.meta.ogDescription ?? '—'],
    ['OG Image', audit.seo.meta.ogImage ?? '—'],
    [],
    ['HEADINGS', 'COUNT'],
    ['H1 Tags', audit.seo.headings.h1.length],
    ['H2 Tags', audit.seo.headings.h2.length],
    ['H3 Tags', audit.seo.headings.h3.length],
    [],
    ['IMAGES', ''],
    ['Total Images', audit.seo.images.total],
    ['Missing Alt Text', audit.seo.images.missingAlt],
    ['Empty Alt Text', audit.seo.images.emptyAlt],
    [],
    ['LINKS', ''],
    ['Internal Links', audit.seo.links.internal],
    ['External Links', audit.seo.links.external],
    [],
    ['TECHNICAL', ''],
    ['HTTPS Enabled', audit.seo.technical.httpsEnabled ? 'Yes' : 'No'],
    ['PageSpeed Score', audit.seo.technical.pageSpeedScore ?? 'N/A'],
  ];
  const wsMeta = XLSX.utils.aoa_to_sheet(seoMetaData);
  wsMeta['!cols'] = [{ wch: 30 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsMeta, 'SEO Details');

  // ── AEO Details Sheet ──
  const aeoData = [
    ['AEO — Structured Data & Answer Engine Details'],
    [],
    ['STRUCTURED DATA', 'PRESENT?'],
    ['Schema Types Found', audit.aeo.structuredData.schemas.join(', ') || 'None'],
    ['FAQ Schema', audit.aeo.structuredData.hasFAQ ? '✓ Yes' : '✗ No'],
    ['HowTo Schema', audit.aeo.structuredData.hasHowTo ? '✓ Yes' : '✗ No'],
    ['Speakable Schema', audit.aeo.structuredData.hasSpeakable ? '✓ Yes' : '✗ No'],
    ['Article Schema', audit.aeo.structuredData.hasArticle ? '✓ Yes' : '✗ No'],
    ['Breadcrumb Schema', audit.aeo.structuredData.hasBreadcrumb ? '✓ Yes' : '✗ No'],
    ['Product Schema', audit.aeo.structuredData.hasProduct ? '✓ Yes' : '✗ No'],
    ['Review Schema', audit.aeo.structuredData.hasReview ? '✓ Yes' : '✗ No'],
    ['Organization Schema', audit.aeo.structuredData.hasOrganization ? '✓ Yes' : '✗ No'],
    [],
    ['FEATURED SNIPPET READINESS', ''],
    ['Has Direct Answers', audit.aeo.featuredSnippetReadiness.hasDirectAnswers ? 'Yes' : 'No'],
    ['Has List Content', audit.aeo.featuredSnippetReadiness.hasListContent ? 'Yes' : 'No'],
    ['Has Table Content', audit.aeo.featuredSnippetReadiness.hasTableContent ? 'Yes' : 'No'],
    ['Question Patterns Count', audit.aeo.featuredSnippetReadiness.questionPhrasing],
    [],
    ['VOICE SEARCH', ''],
    ['Conversational Content', audit.aeo.voiceSearchReadiness.hasConversationalContent ? 'Yes' : 'No'],
    ['Speakable Schema', audit.aeo.voiceSearchReadiness.hasSpeakableSchema ? 'Yes' : 'No'],
    ['Local Business Markup', audit.aeo.voiceSearchReadiness.localBusinessMarkup ? 'Yes' : 'No'],
  ];
  const wsAEO = XLSX.utils.aoa_to_sheet(aeoData);
  wsAEO['!cols'] = [{ wch: 35 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsAEO, 'AEO Details');

  // ── GEO Details Sheet ──
  const geoData = [
    ['GEO — Generative Engine Optimization Details'],
    [],
    ['E-E-A-T SIGNALS', 'PRESENT?'],
    ['Author Information', audit.geo.eatSignals.hasAuthorInfo ? '✓ Yes' : '✗ No'],
    ['Date Published', audit.geo.eatSignals.hasDatePublished ? '✓ Yes' : '✗ No'],
    ['Authoritative Citations', audit.geo.eatSignals.hasCitations ? '✓ Yes' : '✗ No'],
    ['About Page', audit.geo.eatSignals.hasAboutPage ? '✓ Yes' : '✗ No'],
    ['Contact Page', audit.geo.eatSignals.hasContactPage ? '✓ Yes' : '✗ No'],
    ['Privacy Policy', audit.geo.eatSignals.hasPrivacyPolicy ? '✓ Yes' : '✗ No'],
    [],
    ['CONTENT QUALITY', ''],
    ['Word Count', audit.geo.contentQuality.wordCount],
    ['Readability', audit.geo.contentQuality.readabilityScore],
    ['Has Statistics/Data', audit.geo.contentQuality.hasStatistics ? 'Yes' : 'No'],
    ['Has Block Quotes', audit.geo.contentQuality.hasQuotes ? 'Yes' : 'No'],
    ['Has External Sources', audit.geo.contentQuality.hasSources ? 'Yes' : 'No'],
    [],
    ['AI CITATION READINESS', ''],
    ['Entity Markup', audit.geo.aiCitationReadiness.hasEntityMarkup ? 'Yes' : 'No'],
    ['Factual Statements', audit.geo.aiCitationReadiness.hasFactualStatements ? 'Yes' : 'No'],
    ['Wikipedia Links', audit.geo.aiCitationReadiness.hasWikipediaLinks ? 'Yes' : 'No'],
    ['Content Structure Score', audit.geo.aiCitationReadiness.contentStructureScore],
    ['Unique Value Proposition', audit.geo.aiCitationReadiness.uniqueValueProposition ? 'Yes' : 'No'],
    [],
    ['ENTITY CLARITY', ''],
    ['Brand Consistency', audit.geo.entityClarity.brandNameConsistency ? 'Yes' : 'No'],
    ['Topic Focus Score', audit.geo.entityClarity.topicFocusScore],
    ['Semantic Keywords', audit.geo.entityClarity.semanticKeywords.join(', ')],
  ];
  const wsGEO = XLSX.utils.aoa_to_sheet(geoData);
  wsGEO['!cols'] = [{ wch: 35 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsGEO, 'GEO Details');

  XLSX.writeFile(wb, `audit-${new URL(audit.url).hostname}-${Date.now()}.xlsx`);
}
