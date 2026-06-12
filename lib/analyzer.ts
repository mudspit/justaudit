import * as cheerio from 'cheerio';
import https from 'node:https';
import { SEOAudit, AEOAudit, GEOAudit, AuditScore, Issue, PageSpeedResult } from '@/types/audit';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

function calcGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 45) return 'D';
  return 'F';
}

function makeScore(score: number, label: string): AuditScore {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  return { score: s, grade: calcGrade(s), label };
}

export async function fetchPageSpeed(url: string): Promise<PageSpeedResult | null> {
  try {
    const axios = (await import('axios')).default;
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&category=accessibility&category=best-practices&category=seo`;
    const res = await axios.get(apiUrl, { timeout: 25000, httpsAgent, validateStatus: s => s < 500 });
    if (res.status !== 200) return null;
    const data = res.data;
    const cats = data.lighthouseResult?.categories;
    const audits = data.lighthouseResult?.audits;
    return {
      performanceScore: Math.round((cats?.performance?.score ?? 0) * 100),
      accessibilityScore: Math.round((cats?.accessibility?.score ?? 0) * 100),
      bestPracticesScore: Math.round((cats?.['best-practices']?.score ?? 0) * 100),
      seoScore: Math.round((cats?.seo?.score ?? 0) * 100),
      lcp: audits?.['largest-contentful-paint']?.numericValue ?? null,
      fid: audits?.['total-blocking-time']?.numericValue ?? null,
      cls: audits?.['cumulative-layout-shift']?.numericValue ?? null,
      fcp: audits?.['first-contentful-paint']?.numericValue ?? null,
      ttfb: audits?.['server-response-time']?.numericValue ?? null,
    };
  } catch {
    return null;
  }
}

export function analyzeSEO(html: string, url: string, pageSpeed: PageSpeedResult | null): SEOAudit {
  const $ = cheerio.load(html);
  const issues: Issue[] = [];
  let scorePoints = 0;
  let maxPoints = 0;

  // Title
  const title = $('title').first().text().trim() || null;
  const titleLen = title?.length ?? 0;
  maxPoints += 15;
  if (!title) {
    issues.push({ type: 'error', title: 'Missing Page Title', description: 'No <title> tag found.', recommendation: 'Add a unique, descriptive title tag (50–60 characters).', impact: 'high' });
  } else if (titleLen < 30) {
    issues.push({ type: 'warning', title: 'Title Too Short', description: `Title is ${titleLen} characters.`, recommendation: 'Expand title to 50–60 characters with primary keyword.', impact: 'medium' });
    scorePoints += 8;
  } else if (titleLen > 60) {
    issues.push({ type: 'warning', title: 'Title Too Long', description: `Title is ${titleLen} characters (may be truncated in SERPs).`, recommendation: 'Shorten title to under 60 characters.', impact: 'medium' });
    scorePoints += 10;
  } else {
    issues.push({ type: 'pass', title: 'Title Tag Optimal', description: `Title is ${titleLen} characters — well within range.`, recommendation: '', impact: 'low' });
    scorePoints += 15;
  }

  // Meta description
  const desc = $('meta[name="description"]').attr('content')?.trim() || null;
  const descLen = desc?.length ?? 0;
  maxPoints += 12;
  if (!desc) {
    issues.push({ type: 'error', title: 'Missing Meta Description', description: 'No meta description tag found.', recommendation: 'Add a compelling meta description (150–160 characters) with a CTA.', impact: 'high' });
  } else if (descLen < 70) {
    issues.push({ type: 'warning', title: 'Meta Description Too Short', description: `Description is ${descLen} characters.`, recommendation: 'Expand to 150–160 characters.', impact: 'medium' });
    scorePoints += 6;
  } else if (descLen > 160) {
    issues.push({ type: 'warning', title: 'Meta Description Too Long', description: `Description is ${descLen} characters.`, recommendation: 'Shorten to under 160 characters.', impact: 'medium' });
    scorePoints += 9;
  } else {
    issues.push({ type: 'pass', title: 'Meta Description Optimal', description: `Description is ${descLen} characters.`, recommendation: '', impact: 'low' });
    scorePoints += 12;
  }

  // H1
  const h1s = $('h1').map((_, el) => $(el).text().trim()).get();
  const h2s = $('h2').map((_, el) => $(el).text().trim()).get();
  const h3s = $('h3').map((_, el) => $(el).text().trim()).get();
  maxPoints += 10;
  if (h1s.length === 0) {
    issues.push({ type: 'error', title: 'Missing H1 Tag', description: 'No H1 heading found on the page.', recommendation: 'Add one H1 tag with your primary keyword.', impact: 'high' });
  } else if (h1s.length > 1) {
    issues.push({ type: 'warning', title: 'Multiple H1 Tags', description: `Found ${h1s.length} H1 tags. Google prefers one.`, recommendation: 'Use a single H1 tag as the main page heading.', impact: 'medium' });
    scorePoints += 6;
  } else {
    issues.push({ type: 'pass', title: 'Single H1 Tag', description: `H1: "${h1s[0]}"`, recommendation: '', impact: 'low' });
    scorePoints += 10;
  }

  // Images
  const allImgs = $('img');
  const missingAlt = allImgs.filter((_, el) => !$(el).attr('alt') && $(el).attr('alt') !== '').length;
  const emptyAlt = allImgs.filter((_, el) => $(el).attr('alt') === '').length;
  maxPoints += 8;
  if (missingAlt > 0) {
    issues.push({ type: 'warning', title: `${missingAlt} Image(s) Missing Alt Text`, description: `${missingAlt} of ${allImgs.length} images have no alt attribute.`, recommendation: 'Add descriptive alt text to all content images.', impact: 'medium' });
    scorePoints += Math.round(8 * (1 - missingAlt / Math.max(allImgs.length, 1)));
  } else {
    issues.push({ type: 'pass', title: 'All Images Have Alt Text', description: `All ${allImgs.length} images have alt attributes.`, recommendation: '', impact: 'low' });
    scorePoints += 8;
  }

  // Canonical
  const canonical = $('link[rel="canonical"]').attr('href') || null;
  maxPoints += 6;
  if (!canonical) {
    issues.push({ type: 'warning', title: 'No Canonical Tag', description: 'Missing canonical URL tag.', recommendation: 'Add <link rel="canonical"> to prevent duplicate content issues.', impact: 'medium' });
  } else {
    issues.push({ type: 'pass', title: 'Canonical Tag Present', description: `Canonical: ${canonical}`, recommendation: '', impact: 'low' });
    scorePoints += 6;
  }

  // HTTPS
  const httpsEnabled = url.startsWith('https://');
  maxPoints += 10;
  if (!httpsEnabled) {
    issues.push({ type: 'error', title: 'HTTPS Not Enabled', description: 'Site is served over HTTP.', recommendation: 'Install an SSL certificate and redirect all HTTP traffic to HTTPS.', impact: 'high' });
  } else {
    issues.push({ type: 'pass', title: 'HTTPS Enabled', description: 'Site is served over secure HTTPS.', recommendation: '', impact: 'low' });
    scorePoints += 10;
  }

  // Open Graph
  const ogTitle = $('meta[property="og:title"]').attr('content') || null;
  const ogDesc = $('meta[property="og:description"]').attr('content') || null;
  const ogImage = $('meta[property="og:image"]').attr('content') || null;
  maxPoints += 8;
  const ogCount = [ogTitle, ogDesc, ogImage].filter(Boolean).length;
  if (ogCount < 2) {
    issues.push({ type: 'warning', title: 'Incomplete Open Graph Tags', description: `Only ${ogCount}/3 key OG tags present (title, description, image).`, recommendation: 'Add og:title, og:description, og:image for better social sharing.', impact: 'medium' });
    scorePoints += Math.round(8 * ogCount / 3);
  } else {
    issues.push({ type: 'pass', title: 'Open Graph Tags Present', description: 'og:title, og:description, og:image all found.', recommendation: '', impact: 'low' });
    scorePoints += 8;
  }

  // Robots
  const robots = $('meta[name="robots"]').attr('content') || null;
  maxPoints += 5;
  if (robots?.includes('noindex')) {
    issues.push({ type: 'error', title: 'Page Set to noindex', description: 'robots meta tag is blocking search engine indexing.', recommendation: 'Remove noindex if this page should be indexed.', impact: 'high' });
  } else {
    scorePoints += 5;
  }

  // Links
  const allLinks = $('a[href]');
  const internalLinks = allLinks.filter((_, el) => {
    const href = $(el).attr('href') || '';
    return href.startsWith('/') || href.includes(new URL(url).hostname);
  }).length;
  const externalLinks = allLinks.length - internalLinks;

  // PageSpeed bonus
  maxPoints += 26;
  if (pageSpeed) {
    scorePoints += Math.round(pageSpeed.performanceScore * 0.15);
    scorePoints += Math.round(pageSpeed.seoScore * 0.11);
    if (pageSpeed.performanceScore < 50) {
      issues.push({ type: 'error', title: 'Poor Page Performance', description: `PageSpeed score: ${pageSpeed.performanceScore}/100.`, recommendation: 'Optimize images, enable caching, minify CSS/JS, use a CDN.', impact: 'high' });
    } else if (pageSpeed.performanceScore < 90) {
      issues.push({ type: 'warning', title: 'Page Performance Needs Improvement', description: `PageSpeed score: ${pageSpeed.performanceScore}/100.`, recommendation: 'Review Lighthouse suggestions for performance gains.', impact: 'medium' });
    } else {
      issues.push({ type: 'pass', title: 'Excellent Page Performance', description: `PageSpeed score: ${pageSpeed.performanceScore}/100.`, recommendation: '', impact: 'low' });
    }
  }

  const rawScore = maxPoints > 0 ? (scorePoints / maxPoints) * 100 : 50;

  return {
    score: makeScore(rawScore, 'SEO Score'),
    issues,
    meta: {
      title, titleLength: titleLen, description: desc, descriptionLength: descLen,
      canonical, robots: robots || null, ogTitle, ogDescription: ogDesc, ogImage,
    },
    headings: { h1: h1s.slice(0, 5), h2: h2s.slice(0, 10), h3: h3s.slice(0, 10) },
    images: { total: allImgs.length, missingAlt, emptyAlt },
    links: { internal: internalLinks, external: externalLinks, broken: 0 },
    technical: {
      httpsEnabled,
      wwwRedirect: null,
      pageSpeedScore: pageSpeed?.performanceScore ?? null,
      mobileScore: pageSpeed?.performanceScore ?? null,
      coreWebVitals: {
        lcp: pageSpeed?.lcp ?? null,
        fid: pageSpeed?.fid ?? null,
        cls: pageSpeed?.cls ?? null,
      },
    },
  };
}

export function analyzeAEO(html: string): AEOAudit {
  const $ = cheerio.load(html);
  const issues: Issue[] = [];
  let scorePoints = 0;
  let maxPoints = 0;

  // Structured data extraction
  const schemas: object[] = [];
  const schemaTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).html() || '{}');
      const items = Array.isArray(parsed) ? parsed : [parsed];
      items.forEach(item => {
        schemas.push(item);
        const type = item['@type'];
        if (type) schemaTypes.push(Array.isArray(type) ? type.join(', ') : type);
      });
    } catch { /* ignore */ }
  });

  const hasFAQ = schemaTypes.some(t => t.toLowerCase().includes('faq'));
  const hasHowTo = schemaTypes.some(t => t.toLowerCase().includes('howto'));
  const hasSpeakable = schemaTypes.some(t => t.toLowerCase().includes('speakable')) ||
    schemas.some(s => JSON.stringify(s).toLowerCase().includes('speakable'));
  const hasArticle = schemaTypes.some(t => ['article', 'newsarticle', 'blogposting'].includes(t.toLowerCase()));
  const hasBreadcrumb = schemaTypes.some(t => t.toLowerCase().includes('breadcrumb'));
  const hasProduct = schemaTypes.some(t => t.toLowerCase().includes('product'));
  const hasReview = schemaTypes.some(t => t.toLowerCase().includes('review'));
  const hasOrganization = schemaTypes.some(t => ['organization', 'localbusiness'].includes(t.toLowerCase()));

  maxPoints += 20;
  if (schemas.length === 0) {
    issues.push({ type: 'error', title: 'No Structured Data Found', description: 'No JSON-LD schema markup detected.', recommendation: 'Implement Schema.org markup relevant to your content type (Article, FAQ, Product, Organization).', impact: 'high' });
  } else {
    scorePoints += 10;
    issues.push({ type: 'pass', title: `${schemas.length} Schema(s) Detected`, description: `Types: ${schemaTypes.join(', ') || 'unknown'}`, recommendation: '', impact: 'low' });
    if (schemaTypes.length >= 3) scorePoints += 10;
    else scorePoints += 5;
  }

  maxPoints += 20;
  if (!hasFAQ) {
    issues.push({ type: 'warning', title: 'No FAQ Schema', description: 'FAQ schema drives rich results and answer boxes.', recommendation: 'Add FAQPage schema with common questions related to your content. This is the #1 driver of featured snippets.', impact: 'high' });
  } else {
    scorePoints += 20;
    issues.push({ type: 'pass', title: 'FAQ Schema Present', description: 'FAQPage schema detected — excellent for answer boxes.', recommendation: '', impact: 'low' });
  }

  maxPoints += 10;
  if (!hasHowTo) {
    issues.push({ type: 'info', title: 'No HowTo Schema', description: 'HowTo schema can drive rich step-by-step results.', recommendation: 'If you have instructional content, implement HowTo schema.', impact: 'medium' });
  } else {
    scorePoints += 10;
    issues.push({ type: 'pass', title: 'HowTo Schema Present', description: '', recommendation: '', impact: 'low' });
  }

  maxPoints += 10;
  if (!hasSpeakable) {
    issues.push({ type: 'info', title: 'No Speakable Schema', description: 'Speakable schema helps voice assistants read your content.', recommendation: 'Add Speakable schema to mark up key sections for voice search.', impact: 'medium' });
  } else {
    scorePoints += 10;
    issues.push({ type: 'pass', title: 'Speakable Schema Present', description: 'Voice search optimized.', recommendation: '', impact: 'low' });
  }

  // Featured snippet readiness
  const text = $('body').text();
  const hasLists = $('ul li, ol li').length > 3;
  const hasTables = $('table').length > 0;
  const questionCount = (text.match(/\b(what|how|why|when|where|who|which|does|can|is|are)\b[^.?!]*\?/gi) || []).length;
  const hasDirectAnswers = questionCount >= 2;

  maxPoints += 15;
  if (!hasDirectAnswers) {
    issues.push({ type: 'warning', title: 'Low Question-Answer Content', description: `Only ${questionCount} question patterns found.`, recommendation: 'Add Q&A style content. Pages that directly answer questions earn featured snippets.', impact: 'high' });
    scorePoints += 3;
  } else {
    scorePoints += 15;
    issues.push({ type: 'pass', title: 'Good Question-Answer Content', description: `${questionCount} question patterns detected.`, recommendation: '', impact: 'low' });
  }

  maxPoints += 10;
  if (!hasLists) {
    issues.push({ type: 'warning', title: 'Few List Elements', description: 'Numbered/bulleted lists help earn list-type featured snippets.', recommendation: 'Use lists for steps, options, and enumerations to qualify for list featured snippets.', impact: 'medium' });
  } else {
    scorePoints += 10;
    issues.push({ type: 'pass', title: 'List Content Present', description: 'Good use of lists for featured snippet eligibility.', recommendation: '', impact: 'low' });
  }

  if (!hasOrganization) {
    issues.push({ type: 'warning', title: 'No Organization Schema', description: 'Google uses Organization schema for Knowledge Panel data.', recommendation: 'Add Organization or LocalBusiness schema with name, logo, url, contactPoint.', impact: 'medium' });
  }

  const rawScore = maxPoints > 0 ? (scorePoints / maxPoints) * 100 : 50;

  return {
    score: makeScore(rawScore, 'AEO Score'),
    issues,
    structuredData: {
      schemas: schemaTypes, hasFAQ, hasHowTo, hasSpeakable, hasArticle,
      hasBreadcrumb, hasProduct, hasReview, hasOrganization, raw: schemas,
    },
    featuredSnippetReadiness: {
      hasDirectAnswers, hasListContent: hasLists, hasTableContent: hasTables, questionPhrasing: questionCount,
    },
    voiceSearchReadiness: {
      hasConversationalContent: hasDirectAnswers,
      hasSpeakableSchema: hasSpeakable,
      localBusinessMarkup: hasOrganization,
    },
  };
}

export function analyzeGEO(html: string, url: string): GEOAudit {
  const $ = cheerio.load(html);
  const issues: Issue[] = [];
  let scorePoints = 0;
  let maxPoints = 0;

  const text = $('body').text();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // E-E-A-T signals
  const pageLinks = $('a[href]').map((_, el) => $(el).attr('href') || '').get();
  const hasAuthorInfo = $('[rel="author"], .author, [itemprop="author"], .byline').length > 0 ||
    text.toLowerCase().includes('written by') || text.toLowerCase().includes('author:');
  const hasDatePublished = $('[itemprop="datePublished"], time[datetime], .published, .post-date').length > 0;
  const hasCitations = pageLinks.filter(h => h.includes('wikipedia') || h.includes('gov') || h.includes('edu') || h.includes('pubmed')).length > 0;
  const hasAboutPage = pageLinks.some(h => h.toLowerCase().includes('/about'));
  const hasContactPage = pageLinks.some(h => h.toLowerCase().includes('/contact'));
  const hasPrivacyPolicy = pageLinks.some(h => h.toLowerCase().includes('privacy'));

  maxPoints += 15;
  if (!hasAuthorInfo) {
    issues.push({ type: 'warning', title: 'No Author Information', description: 'AI models prioritize content with clear authorship (E-E-A-T).', recommendation: 'Add author bylines with author schema markup. Include bio, credentials, and social links.', impact: 'high' });
  } else {
    scorePoints += 15;
    issues.push({ type: 'pass', title: 'Author Information Present', description: 'E-E-A-T signal: authorship detected.', recommendation: '', impact: 'low' });
  }

  maxPoints += 10;
  if (!hasDatePublished) {
    issues.push({ type: 'warning', title: 'No Publication Date', description: 'AI systems prefer content with clear publication/update dates.', recommendation: 'Add visible publication dates and update them regularly. Use datePublished schema.', impact: 'medium' });
  } else {
    scorePoints += 10;
    issues.push({ type: 'pass', title: 'Publication Date Present', description: 'Good freshness signal for AI systems.', recommendation: '', impact: 'low' });
  }

  maxPoints += 15;
  if (!hasCitations) {
    issues.push({ type: 'warning', title: 'No Authoritative Citations', description: 'No links to .gov, .edu, Wikipedia, or research sources.', recommendation: 'Cite authoritative sources. AI models value content that references trustworthy external sources.', impact: 'high' });
  } else {
    scorePoints += 15;
    issues.push({ type: 'pass', title: 'Authoritative Citations Found', description: 'Links to trusted sources strengthen AI citation likelihood.', recommendation: '', impact: 'low' });
  }

  maxPoints += 8;
  if (!hasAboutPage) {
    issues.push({ type: 'warning', title: 'No About Page Link', description: 'About pages are key trust signals for AI systems.', recommendation: 'Create a detailed About page with company/author credentials and history.', impact: 'medium' });
  } else {
    scorePoints += 8;
  }

  maxPoints += 5;
  if (!hasContactPage) {
    issues.push({ type: 'info', title: 'No Contact Page Link', description: 'Contact pages signal legitimacy.', recommendation: 'Add a contact page with multiple ways to reach you.', impact: 'low' });
  } else {
    scorePoints += 5;
  }

  // Content quality
  maxPoints += 15;
  if (wordCount < 300) {
    issues.push({ type: 'error', title: 'Thin Content', description: `Page has only ~${wordCount} words — too thin for AI citation.`, recommendation: 'Expand to at least 800–1200 words with comprehensive, factual coverage of the topic.', impact: 'high' });
  } else if (wordCount < 600) {
    issues.push({ type: 'warning', title: 'Low Word Count', description: `~${wordCount} words. AI models prefer comprehensive content.`, recommendation: 'Expand content to 800+ words with supporting data, examples, and context.', impact: 'medium' });
    scorePoints += 7;
  } else {
    scorePoints += 15;
    issues.push({ type: 'pass', title: `Good Content Length (~${wordCount} words)`, description: 'Sufficient content depth for AI indexing.', recommendation: '', impact: 'low' });
  }

  // Statistics and facts
  const hasStatistics = /\d+%|\d+\s*(million|billion|thousand)|research shows|studies show|according to/i.test(text);
  maxPoints += 10;
  if (!hasStatistics) {
    issues.push({ type: 'warning', title: 'No Statistics or Data Points', description: 'AI systems prefer content backed by data.', recommendation: 'Include specific statistics, research findings, and data points with citations.', impact: 'high' });
  } else {
    scorePoints += 10;
    issues.push({ type: 'pass', title: 'Statistics/Data Points Present', description: 'Factual claims with data improve AI citation likelihood.', recommendation: '', impact: 'low' });
  }

  // Content structure for AI
  const hasHeadings = $('h2, h3').length >= 3;
  maxPoints += 10;
  if (!hasHeadings) {
    issues.push({ type: 'warning', title: 'Poor Content Structure', description: 'Insufficient subheadings for AI parsing.', recommendation: 'Use H2/H3 headings to clearly delineate sections. AI systems parse structured content better.', impact: 'medium' });
  } else {
    scorePoints += 10;
    issues.push({ type: 'pass', title: 'Well-Structured Content', description: 'Good heading hierarchy for AI comprehension.', recommendation: '', impact: 'low' });
  }

  // Unique value
  const hasUVP = text.length > 2000 && hasStatistics && hasHeadings;
  maxPoints += 12;
  if (!hasUVP) {
    issues.push({ type: 'info', title: 'Unique Value Proposition Unclear', description: 'Content needs stronger differentiation to be cited by AI over competitors.', recommendation: 'Add original research, unique insights, proprietary data, or expert opinion not found elsewhere.', impact: 'high' });
    scorePoints += 3;
  } else {
    scorePoints += 12;
    issues.push({ type: 'pass', title: 'Strong Content Depth', description: 'Content has depth and originality signals.', recommendation: '', impact: 'low' });
  }

  // Entity/brand signals
  const hostname = new URL(url).hostname.replace('www.', '');
  const brandName = hostname.split('.')[0];
  const brandMentions = (text.match(new RegExp(brandName, 'gi')) || []).length;

  // Semantic keyword extraction (simple)
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 5);
  const freq: Record<string, number> = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  const semanticKeywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([w]) => w)
    .filter(w => !['about', 'which', 'there', 'their', 'these', 'would', 'could', 'should'].includes(w));

  const rawScore = maxPoints > 0 ? (scorePoints / maxPoints) * 100 : 50;

  return {
    score: makeScore(rawScore, 'GEO Score'),
    issues,
    eatSignals: {
      hasAuthorInfo, hasDatePublished, hasCitations, hasAboutPage, hasContactPage, hasPrivacyPolicy,
    },
    contentQuality: {
      wordCount,
      readabilityScore: wordCount > 1000 ? 'Comprehensive' : wordCount > 500 ? 'Moderate' : 'Thin',
      hasStatistics,
      hasQuotes: $('blockquote').length > 0,
      hasSources: hasCitations,
    },
    aiCitationReadiness: {
      hasEntityMarkup: $('[itemscope], script[type="application/ld+json"]').length > 0,
      hasFactualStatements: hasStatistics,
      hasWikipediaLinks: pageLinks.some(h => h.includes('wikipedia')),
      contentStructureScore: hasHeadings ? 80 : 40,
      uniqueValueProposition: hasUVP,
    },
    entityClarity: {
      brandNameConsistency: brandMentions >= 2,
      topicFocusScore: Math.min(100, semanticKeywords.length * 7),
      semanticKeywords: semanticKeywords.slice(0, 10),
    },
  };
}
