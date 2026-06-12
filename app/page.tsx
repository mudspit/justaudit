'use client';

import { useState } from 'react';
import { AuditResult } from '@/types/audit';
import ScoreCard from '@/components/ScoreCard';
import IssueList from '@/components/IssueList';
import MetaTable from '@/components/MetaTable';

type Tab = 'overview' | 'seo' | 'aeo' | 'geo' | 'vitals';

/* ── Hollow check SVG logo (ink black) ── */
function CheckLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="12.5" stroke="#111111" strokeWidth="1.5"/>
      <polyline points="8,14 12.5,18.5 20,10" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

/* ── Nike button styles ── */
const btnPrimary: React.CSSProperties = {
  background: '#111111',
  color: '#ffffff',
  border: 'none',
  padding: '0 32px',
  height: 48,
  fontSize: 16,
  fontWeight: 500,
  cursor: 'pointer',
  borderRadius: 9999,
  fontFamily: 'inherit',
  whiteSpace: 'nowrap' as const,
  flexShrink: 0,
};

const btnSecondary: React.CSSProperties = {
  background: '#f5f5f5',
  color: '#111111',
  border: 'none',
  padding: '0 24px',
  height: 48,
  fontSize: 16,
  fontWeight: 500,
  cursor: 'pointer',
  borderRadius: 9999,
  fontFamily: 'inherit',
  whiteSpace: 'nowrap' as const,
};

const btnOutlineSuccess: React.CSSProperties = {
  background: '#ffffff',
  color: '#007d48',
  border: '1.5px solid #007d48',
  padding: '0 24px',
  height: 48,
  fontSize: 16,
  fontWeight: 500,
  cursor: 'pointer',
  borderRadius: 9999,
  fontFamily: 'inherit',
  whiteSpace: 'nowrap' as const,
};

const btnGhost: React.CSSProperties = {
  background: '#f5f5f5',
  color: '#707072',
  border: 'none',
  padding: '0 20px',
  height: 40,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  borderRadius: 9999,
  fontFamily: 'inherit',
};

export default function Home() {
  const [url, setUrl]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError]   = useState('');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [tab, setTab]       = useState<Tab>('overview');

  async function runAudit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setProgress('Fetching page...');

    const steps = [
      { msg: 'Fetching page…',                     delay: 0     },
      { msg: 'Running PageSpeed analysis…',         delay: 1200  },
      { msg: 'Analyzing SEO signals…',              delay: 3000  },
      { msg: 'Checking structured data (AEO)…',     delay: 5000  },
      { msg: 'Evaluating AI citation readiness…',   delay: 8000  },
      { msg: 'Compiling report…',                   delay: 12000 },
    ];
    const timers: ReturnType<typeof setTimeout>[] = [];
    steps.forEach(s => { timers.push(setTimeout(() => setProgress(s.msg), s.delay)); });

    try {
      const res  = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      timers.forEach(clearTimeout);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Audit failed');
      setResult(data);
      setTab('overview');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
      setProgress('');
    }
  }

  async function handleDownloadPDF() {
    if (!result) return;
    const { downloadPDF } = await import('@/lib/exportPdf');
    await downloadPDF(result);
  }
  async function handleDownloadXLS() {
    if (!result) return;
    const { downloadXLS } = await import('@/lib/exportXls');
    await downloadXLS(result);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview'        },
    { id: 'seo',      label: 'SEO'             },
    { id: 'aeo',      label: 'AEO'             },
    { id: 'geo',      label: 'GEO'             },
    { id: 'vitals',   label: 'Core Web Vitals' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'Inter, Helvetica, Arial, sans-serif', color: '#111111' }}>

      {/* ── UTILITY BAR ── */}
      <div style={{
        background: '#f5f5f5',
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 24px',
      }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#707072' }}>
          Free · No signup required
        </span>
      </div>

      {/* ── PRIMARY NAV ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: '#ffffff',
        borderBottom: '1px solid #cacacb',
        height: 56,
        display: 'flex', alignItems: 'center',
        padding: '0 24px',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckLogo size={24} />
            <span style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '-0.2px',
              color: '#111111',
            }}>JUST AUDIT</span>
          </div>
          <span style={{
            fontSize: 13,
            fontWeight: 500,
            color: '#707072',
          }}>SEO · AEO · GEO</span>
        </div>
      </header>

      {/* ── HERO (shown only before results) ── */}
      {!result && !loading && (
        <div style={{
          background: '#ffffff',
          padding: '96px 24px 64px',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <h1 style={{
              fontSize: 'clamp(48px, 8vw, 96px)',
              fontWeight: 700,
              lineHeight: 0.9,
              letterSpacing: '-1px',
              color: '#111111',
              textTransform: 'uppercase',
              margin: 0,
              marginBottom: 24,
            }}>
              Audit Your Website
            </h1>
            <p style={{
              fontSize: 16,
              fontWeight: 400,
              color: '#707072',
              lineHeight: 1.5,
              marginBottom: 40,
            }}>
              Full analysis covering SEO, Answer Engine Optimization, and Generative Engine Optimization — with a downloadable report.
            </p>

            {/* Feature pills */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              {[
                'SEO · Technical & On-Page',
                'AEO · Schema & Snippets',
                'GEO · AI Citation & E-E-A-T',
                'Core Web Vitals',
              ].map(label => (
                <span key={label} style={{
                  background: '#f5f5f5',
                  color: '#111111',
                  fontSize: 13,
                  fontWeight: 500,
                  padding: '8px 16px',
                  borderRadius: 9999,
                }}>{label}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── URL FORM BAND ── */}
      <div style={{
        background: '#ffffff',
        borderTop: result || loading ? 'none' : '1px solid #e5e5e5',
        borderBottom: '1px solid #cacacb',
        padding: '16px 24px',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <form onSubmit={runAudit} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={loading}
              style={{
                flex: 1,
                height: 48,
                background: '#f5f5f5',
                color: '#111111',
                border: 'none',
                borderRadius: 9999,
                padding: '0 20px',
                fontSize: 16,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              style={{ ...btnPrimary, opacity: loading || !url.trim() ? 0.4 : 1 }}
            >
              {loading ? 'Auditing…' : 'Run Audit'}
            </button>
          </form>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px' }}>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <CheckLogo size={48} />
            <p style={{
              marginTop: 16,
              fontSize: 14,
              fontWeight: 500,
              color: '#707072',
            }}>{progress}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            maxWidth: 560, margin: '0 auto',
            borderLeft: '2px solid #d30005',
            background: 'rgba(211,0,5,0.04)',
            padding: '12px 16px',
            marginTop: 16,
            borderRadius: '0 8px 8px 0',
          }}>
            <p style={{
              fontSize: 12,
              fontWeight: 500,
              color: '#d30005',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 4,
            }}>Error</p>
            <p style={{ fontSize: 14, color: '#111111' }}>{error}</p>
            <p style={{ fontSize: 12, color: '#707072', marginTop: 4 }}>
              Make sure the URL is accessible and try again.
            </p>
          </div>
        )}

        {/* ── RESULTS ── */}
        {result && (
          <div>
            {/* Result meta bar */}
            <div style={{
              display: 'flex', flexWrap: 'wrap',
              alignItems: 'center', justifyContent: 'space-between',
              gap: 8,
              paddingBottom: 16,
              borderBottom: '1px solid #cacacb',
              marginBottom: 20,
            }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#9e9ea0', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Audit Report
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <a href={result.url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 20, fontWeight: 700, color: '#111111', textDecoration: 'none', letterSpacing: '-0.2px' }}>
                    {result.domain}
                  </a>
                  <span style={{ fontSize: 13, color: '#9e9ea0' }}>
                    · {new Date(result.auditDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: '#707072', marginTop: 2 }}>{result.pageTitle}</p>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={handleDownloadPDF} style={btnPrimary}>PDF Report</button>
                <button onClick={handleDownloadXLS} style={btnOutlineSuccess}>Excel Report</button>
                <button onClick={() => { setResult(null); setUrl(''); }} style={btnGhost}>New Audit</button>
              </div>
            </div>

            {/* Score cards — 4-up */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              marginBottom: 24,
            }}>
              <ScoreCard auditScore={result.overallScore} category="Overall"  icon="" description="SEO 40% · AEO 30% · GEO 30%" />
              <ScoreCard auditScore={result.seo.score}    category="SEO"      icon="" description="Technical, on-page, metadata" />
              <ScoreCard auditScore={result.aeo.score}    category="AEO"      icon="" description="Answer engine readiness" />
              <ScoreCard auditScore={result.geo.score}    category="GEO"      icon="" description="AI citation & E-E-A-T" />
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #cacacb',
              marginBottom: 20,
              gap: 0,
              overflowX: 'auto',
            }}>
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: tab === t.id ? '2px solid #111111' : '2px solid transparent',
                    padding: '12px 16px',
                    fontSize: 14,
                    fontWeight: 500,
                    color: tab === t.id ? '#111111' : '#707072',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                    marginBottom: -1,
                  }}
                >{t.label}</button>
              ))}
            </div>

            {/* ── TAB: OVERVIEW ── */}
            {tab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <MetaTable title="Key Findings" icon="" rows={[
                  { label: 'Page Title',      value: result.seo.meta.title,                  status: result.seo.meta.title ? 'good' : 'bad' },
                  { label: 'Meta Description',value: result.seo.meta.description,             status: result.seo.meta.description ? 'good' : 'bad' },
                  { label: 'Canonical URL',   value: result.seo.meta.canonical,               status: result.seo.meta.canonical ? 'good' : 'warn' },
                  { label: 'HTTPS',           value: result.seo.technical.httpsEnabled,       status: result.seo.technical.httpsEnabled ? 'good' : 'bad' },
                  { label: 'H1 Tags',         value: result.seo.headings.h1.length,           status: result.seo.headings.h1.length === 1 ? 'good' : result.seo.headings.h1.length === 0 ? 'bad' : 'warn' },
                  { label: 'Images w/o Alt',  value: result.seo.images.missingAlt,            status: result.seo.images.missingAlt === 0 ? 'good' : 'warn' },
                  { label: 'Schema Types',    value: result.aeo.structuredData.schemas.join(', ') || 'None', status: result.aeo.structuredData.schemas.length > 0 ? 'good' : 'bad' },
                  { label: 'Word Count',      value: result.geo.contentQuality.wordCount,     status: result.geo.contentQuality.wordCount >= 600 ? 'good' : 'warn' },
                  { label: 'Author Info',     value: result.geo.eatSignals.hasAuthorInfo,     status: result.geo.eatSignals.hasAuthorInfo ? 'good' : 'warn' },
                  { label: 'PageSpeed Score', value: result.pageSpeed ? `${result.pageSpeed.performanceScore}/100` : 'N/A', status: result.pageSpeed ? (result.pageSpeed.performanceScore >= 90 ? 'good' : result.pageSpeed.performanceScore >= 50 ? 'warn' : 'bad') : 'neutral' },
                ]} />

                <MetaTable title="AEO & GEO Signals" icon="" rows={[
                  { label: 'FAQ Schema',           value: result.aeo.structuredData.hasFAQ,              status: result.aeo.structuredData.hasFAQ ? 'good' : 'warn' },
                  { label: 'HowTo Schema',         value: result.aeo.structuredData.hasHowTo,            status: result.aeo.structuredData.hasHowTo ? 'good' : 'neutral' },
                  { label: 'Speakable Schema',     value: result.aeo.structuredData.hasSpeakable,        status: result.aeo.structuredData.hasSpeakable ? 'good' : 'neutral' },
                  { label: 'Organization Schema',  value: result.aeo.structuredData.hasOrganization,     status: result.aeo.structuredData.hasOrganization ? 'good' : 'warn' },
                  { label: 'Q&A Patterns',         value: result.aeo.featuredSnippetReadiness.questionPhrasing },
                  { label: 'List Content',         value: result.aeo.featuredSnippetReadiness.hasListContent, status: result.aeo.featuredSnippetReadiness.hasListContent ? 'good' : 'warn' },
                  { label: 'Author Info',          value: result.geo.eatSignals.hasAuthorInfo,           status: result.geo.eatSignals.hasAuthorInfo ? 'good' : 'warn' },
                  { label: 'Citations',            value: result.geo.eatSignals.hasCitations,            status: result.geo.eatSignals.hasCitations ? 'good' : 'warn' },
                  { label: 'Statistics / Data',    value: result.geo.contentQuality.hasStatistics,       status: result.geo.contentQuality.hasStatistics ? 'good' : 'warn' },
                  { label: 'About Page',           value: result.geo.eatSignals.hasAboutPage,            status: result.geo.eatSignals.hasAboutPage ? 'good' : 'warn' },
                ]} />

                {/* Priority fixes */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #cacacb',
                    borderLeft: '3px solid #d30005',
                  }}>
                    <div style={{
                      padding: '12px 20px',
                      borderBottom: '1px solid #e5e5e5',
                      background: '#f5f5f5',
                    }}>
                      <p style={{
                        fontSize: 12,
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: '#d30005',
                      }}>Priority Fixes</p>
                    </div>
                    <div style={{ padding: '16px 20px' }}>
                      {(() => {
                        const criticals = [...result.seo.issues, ...result.aeo.issues, ...result.geo.issues]
                          .filter(i => i.type === 'error' && i.impact === 'high')
                          .slice(0, 5);
                        return criticals.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {criticals.map((issue, i) => (
                              <div key={i} style={{
                                display: 'flex', gap: 12,
                                borderBottom: '1px solid #e5e5e5',
                                paddingBottom: 12,
                              }}>
                                <span style={{
                                  background: '#111111',
                                  color: '#ffffff',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  borderRadius: 9999,
                                  width: 20,
                                  height: 20,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  marginTop: 2,
                                }}>
                                  {i + 1}
                                </span>
                                <div>
                                  <p style={{ fontSize: 14, fontWeight: 500, color: '#111111', marginBottom: 2 }}>{issue.title}</p>
                                  <p style={{ fontSize: 13, color: '#4b4b4d' }}>{issue.recommendation}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: 14, color: '#707072' }}>
                            No critical errors detected. Review warnings below.
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: SEO ── */}
            {tab === 'seo' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <MetaTable title="Meta Tags" icon="" rows={[
                    { label: 'Title',          value: result.seo.meta.title,           status: result.seo.meta.title ? (result.seo.meta.titleLength >= 30 && result.seo.meta.titleLength <= 60 ? 'good' : 'warn') : 'bad' },
                    { label: 'Title Length',   value: `${result.seo.meta.titleLength} chars`, status: result.seo.meta.titleLength >= 30 && result.seo.meta.titleLength <= 60 ? 'good' : 'warn' },
                    { label: 'Description',    value: result.seo.meta.description },
                    { label: 'Desc Length',    value: `${result.seo.meta.descriptionLength} chars`, status: result.seo.meta.descriptionLength >= 70 && result.seo.meta.descriptionLength <= 160 ? 'good' : 'warn' },
                    { label: 'Canonical',      value: result.seo.meta.canonical,       status: result.seo.meta.canonical ? 'good' : 'warn' },
                    { label: 'Robots',         value: result.seo.meta.robots || 'Not set' },
                    { label: 'OG Title',       value: result.seo.meta.ogTitle,         status: result.seo.meta.ogTitle ? 'good' : 'warn' },
                    { label: 'OG Description', value: result.seo.meta.ogDescription,   status: result.seo.meta.ogDescription ? 'good' : 'warn' },
                    { label: 'OG Image',       value: result.seo.meta.ogImage ? 'Present' : 'Missing', status: result.seo.meta.ogImage ? 'good' : 'warn' },
                  ]} />
                  <MetaTable title="Page Structure" icon="" rows={[
                    { label: 'H1 Count',       value: result.seo.headings.h1.length,   status: result.seo.headings.h1.length === 1 ? 'good' : 'warn' },
                    { label: 'H1 Text',        value: result.seo.headings.h1[0] || '—' },
                    { label: 'H2 Count',       value: result.seo.headings.h2.length },
                    { label: 'H3 Count',       value: result.seo.headings.h3.length },
                    { label: 'Total Images',   value: result.seo.images.total },
                    { label: 'Missing Alt',    value: result.seo.images.missingAlt,    status: result.seo.images.missingAlt === 0 ? 'good' : 'warn' },
                    { label: 'Internal Links', value: result.seo.links.internal },
                    { label: 'External Links', value: result.seo.links.external },
                    { label: 'HTTPS',          value: result.seo.technical.httpsEnabled, status: result.seo.technical.httpsEnabled ? 'good' : 'bad' },
                  ]} />
                </div>
                <IssueList issues={result.seo.issues} title="SEO Issues & Recommendations" />
              </div>
            )}

            {/* ── TAB: AEO ── */}
            {tab === 'aeo' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <MetaTable title="Structured Data" icon="" rows={[
                    { label: 'Schemas Found',   value: result.aeo.structuredData.schemas.length },
                    { label: 'Schema Types',    value: result.aeo.structuredData.schemas.join(', ') || 'None' },
                    { label: 'FAQ Schema',      value: result.aeo.structuredData.hasFAQ,          status: result.aeo.structuredData.hasFAQ ? 'good' : 'warn' },
                    { label: 'HowTo Schema',    value: result.aeo.structuredData.hasHowTo },
                    { label: 'Speakable',       value: result.aeo.structuredData.hasSpeakable },
                    { label: 'Article',         value: result.aeo.structuredData.hasArticle },
                    { label: 'Breadcrumb',      value: result.aeo.structuredData.hasBreadcrumb },
                    { label: 'Product',         value: result.aeo.structuredData.hasProduct },
                    { label: 'Review',          value: result.aeo.structuredData.hasReview },
                    { label: 'Organization',    value: result.aeo.structuredData.hasOrganization,  status: result.aeo.structuredData.hasOrganization ? 'good' : 'warn' },
                  ]} />
                  <MetaTable title="Featured Snippet & Voice" icon="" rows={[
                    { label: 'Direct Answers',    value: result.aeo.featuredSnippetReadiness.hasDirectAnswers,  status: result.aeo.featuredSnippetReadiness.hasDirectAnswers ? 'good' : 'warn' },
                    { label: 'Question Patterns', value: result.aeo.featuredSnippetReadiness.questionPhrasing },
                    { label: 'List Content',      value: result.aeo.featuredSnippetReadiness.hasListContent,    status: result.aeo.featuredSnippetReadiness.hasListContent ? 'good' : 'warn' },
                    { label: 'Table Content',     value: result.aeo.featuredSnippetReadiness.hasTableContent },
                    { label: 'Conversational',    value: result.aeo.voiceSearchReadiness.hasConversationalContent },
                    { label: 'Speakable Schema',  value: result.aeo.voiceSearchReadiness.hasSpeakableSchema },
                    { label: 'Local Business',    value: result.aeo.voiceSearchReadiness.localBusinessMarkup },
                  ]} />
                </div>
                <IssueList issues={result.aeo.issues} title="AEO Issues & Recommendations" />
              </div>
            )}

            {/* ── TAB: GEO ── */}
            {tab === 'geo' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <MetaTable title="E-E-A-T Signals" icon="" rows={[
                    { label: 'Author Info',      value: result.geo.eatSignals.hasAuthorInfo,    status: result.geo.eatSignals.hasAuthorInfo ? 'good' : 'warn' },
                    { label: 'Date Published',   value: result.geo.eatSignals.hasDatePublished, status: result.geo.eatSignals.hasDatePublished ? 'good' : 'warn' },
                    { label: 'Citations',        value: result.geo.eatSignals.hasCitations,     status: result.geo.eatSignals.hasCitations ? 'good' : 'warn' },
                    { label: 'About Page',       value: result.geo.eatSignals.hasAboutPage,     status: result.geo.eatSignals.hasAboutPage ? 'good' : 'warn' },
                    { label: 'Contact Page',     value: result.geo.eatSignals.hasContactPage,   status: result.geo.eatSignals.hasContactPage ? 'good' : 'warn' },
                    { label: 'Privacy Policy',   value: result.geo.eatSignals.hasPrivacyPolicy, status: result.geo.eatSignals.hasPrivacyPolicy ? 'good' : 'warn' },
                  ]} />
                  <MetaTable title="AI Citation Readiness" icon="" rows={[
                    { label: 'Word Count',        value: result.geo.contentQuality.wordCount,             status: result.geo.contentQuality.wordCount >= 600 ? 'good' : 'warn' },
                    { label: 'Readability',       value: result.geo.contentQuality.readabilityScore },
                    { label: 'Has Statistics',    value: result.geo.contentQuality.hasStatistics,         status: result.geo.contentQuality.hasStatistics ? 'good' : 'warn' },
                    { label: 'Block Quotes',      value: result.geo.contentQuality.hasQuotes },
                    { label: 'Wikipedia Links',   value: result.geo.aiCitationReadiness.hasWikipediaLinks },
                    { label: 'Entity Markup',     value: result.geo.aiCitationReadiness.hasEntityMarkup,  status: result.geo.aiCitationReadiness.hasEntityMarkup ? 'good' : 'warn' },
                    { label: 'Structure Score',   value: `${result.geo.aiCitationReadiness.contentStructureScore}/100` },
                    { label: 'Brand Consistency', value: result.geo.entityClarity.brandNameConsistency,   status: result.geo.entityClarity.brandNameConsistency ? 'good' : 'warn' },
                  ]} />
                </div>

                {/* Semantic keywords */}
                {result.geo.entityClarity.semanticKeywords.length > 0 && (
                  <div style={{
                    background: '#f5f5f5',
                    padding: '16px 20px',
                    border: '1px solid #cacacb',
                  }}>
                    <p style={{
                      fontSize: 12,
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: '#111111',
                      marginBottom: 12,
                    }}>Semantic Keywords</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {result.geo.entityClarity.semanticKeywords.map((kw, i) => (
                        <span key={i} style={{
                          background: '#ffffff',
                          border: '1px solid #cacacb',
                          color: '#111111',
                          fontSize: 13,
                          fontWeight: 500,
                          padding: '6px 14px',
                          borderRadius: 9999,
                        }}>{kw}</span>
                      ))}
                    </div>
                    <p style={{ fontSize: 12, color: '#707072', marginTop: 10 }}>
                      Most frequent semantic terms. Ensure alignment with target topics.
                    </p>
                  </div>
                )}

                <IssueList issues={result.geo.issues} title="GEO Issues & Recommendations" />
              </div>
            )}

            {/* ── TAB: VITALS ── */}
            {tab === 'vitals' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.pageSpeed ? (
                  <>
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                      border: '1px solid #cacacb',
                      background: '#ffffff',
                    }}>
                      {[
                        { label: 'Performance',    value: result.pageSpeed.performanceScore  },
                        { label: 'Accessibility',  value: result.pageSpeed.accessibilityScore },
                        { label: 'Best Practices', value: result.pageSpeed.bestPracticesScore },
                        { label: 'SEO (Lighthouse)',value: result.pageSpeed.seoScore         },
                      ].map((m, i) => {
                        const c = m.value >= 90 ? '#007d48' : m.value >= 50 ? '#f6c700' : '#d30005';
                        return (
                          <div key={i} style={{
                            padding: '20px',
                            borderRight: i < 3 ? '1px solid #cacacb' : 'none',
                            borderTop: `3px solid ${c}`,
                            textAlign: 'center',
                            background: '#f5f5f5',
                          }}>
                            <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1, letterSpacing: '-1px', color: c }}>
                              {m.value}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 500, color: '#707072', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {m.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <MetaTable title="Core Web Vitals — Mobile" icon="" rows={[
                      { label: 'LCP  (< 2.5s)', value: result.pageSpeed.lcp  ? `${(result.pageSpeed.lcp  / 1000).toFixed(2)}s` : 'N/A', status: result.pageSpeed.lcp  ? (result.pageSpeed.lcp  < 2500 ? 'good' : result.pageSpeed.lcp  < 4000 ? 'warn' : 'bad') : 'neutral' },
                      { label: 'FCP  (< 1.8s)', value: result.pageSpeed.fcp  ? `${(result.pageSpeed.fcp  / 1000).toFixed(2)}s` : 'N/A', status: result.pageSpeed.fcp  ? (result.pageSpeed.fcp  < 1800 ? 'good' : result.pageSpeed.fcp  < 3000 ? 'warn' : 'bad') : 'neutral' },
                      { label: 'CLS  (< 0.1)',  value: result.pageSpeed.cls  !== null ? result.pageSpeed.cls!.toFixed(3)          : 'N/A', status: result.pageSpeed.cls  !== null ? (result.pageSpeed.cls! < 0.1 ? 'good' : result.pageSpeed.cls! < 0.25 ? 'warn' : 'bad') : 'neutral' },
                      { label: 'TTFB (< 800ms)',value: result.pageSpeed.ttfb ? `${Math.round(result.pageSpeed.ttfb)}ms`            : 'N/A', status: result.pageSpeed.ttfb ? (result.pageSpeed.ttfb < 800  ? 'good' : result.pageSpeed.ttfb < 1800  ? 'warn' : 'bad') : 'neutral' },
                    ]} />

                    <div style={{
                      background: '#f5f5f5',
                      borderLeft: '2px solid #cacacb',
                      padding: '14px 20px',
                      border: '1px solid #cacacb',
                    }}>
                      <p style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9e9ea0', marginBottom: 6 }}>
                        About Core Web Vitals
                      </p>
                      <p style={{ fontSize: 13, color: '#4b4b4d', lineHeight: 1.6 }}>
                        Core Web Vitals are Google&apos;s user experience metrics with direct ranking impact.
                        <strong style={{ color: '#111111' }}> LCP</strong> measures load speed,
                        <strong style={{ color: '#111111' }}> CLS</strong> measures layout stability,
                        <strong style={{ color: '#111111' }}> FCP</strong> measures time to first content.
                        Measured on mobile via the Google PageSpeed Insights API.
                      </p>
                    </div>
                  </>
                ) : (
                  <div style={{
                    borderLeft: '2px solid #f6c700',
                    background: 'rgba(246,199,0,0.04)',
                    padding: '12px 16px',
                    border: '1px solid #cacacb',
                  }}>
                    <p style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#f6c700', marginBottom: 4 }}>
                      Unavailable
                    </p>
                    <p style={{ fontSize: 14, color: '#4b4b4d' }}>
                      PageSpeed data not returned for this URL. The page may block crawlers or the API rate limit was reached.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Download CTA band ── */}
            <div style={{
              marginTop: 32,
              background: '#111111',
              padding: '24px',
              borderRadius: 0,
              display: 'flex', flexWrap: 'wrap',
              alignItems: 'center', justifyContent: 'space-between', gap: 16,
            }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9e9ea0', marginBottom: 4 }}>
                  Download Report
                </p>
                <p style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.2px', color: '#ffffff' }}>
                  Share with your team or clients
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleDownloadPDF} style={{
                  ...btnSecondary,
                }}>PDF Report</button>
                <button onClick={handleDownloadXLS} style={{
                  background: '#007d48',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0 24px',
                  height: 48,
                  fontSize: 16,
                  fontWeight: 500,
                  cursor: 'pointer',
                  borderRadius: 9999,
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap' as const,
                }}>Excel Report</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        marginTop: 48,
        background: '#ffffff',
        borderTop: '1px solid #cacacb',
        padding: '20px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckLogo size={18} />
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.1px', color: '#111111' }}>
            JUST AUDIT
          </span>
        </div>
        <p style={{ fontSize: 12, fontWeight: 500, color: '#9e9ea0' }}>
          SEO · AEO · GEO · Powered by Google PageSpeed Insights
        </p>
      </footer>
    </div>
  );
}
