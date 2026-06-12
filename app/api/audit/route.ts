import { NextRequest, NextResponse } from 'next/server';
import { analyzeSEO, analyzeAEO, analyzeGEO, fetchPageSpeed } from '@/lib/analyzer';
import { AuditResult } from '@/types/audit';
import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export const maxDuration = 60;

function calcOverall(seo: number, aeo: number, geo: number) {
  const score = Math.round(seo * 0.4 + aeo * 0.3 + geo * 0.3);
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 45 ? 'D' : 'F';
  return { score, grade: grade as 'A' | 'B' | 'C' | 'D' | 'F', label: 'Overall Score' };
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const normalizedUrl = parsedUrl.toString();

    // Fetch the page HTML using axios (handles Windows CA store / TLS better than Next.js built-in fetch)
    let html = '';
    let pageTitle = '';
    try {
      const axios = (await import('axios')).default;
      const response = await axios.get(normalizedUrl, {
        timeout: 15000,
        httpsAgent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        maxRedirects: 5,
        responseType: 'text',
        validateStatus: (s) => s < 500,
      });
      if (response.status >= 400) {
        return NextResponse.json({ error: `Failed to fetch URL: HTTP ${response.status}` }, { status: 422 });
      }
      html = response.data as string;
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      pageTitle = titleMatch ? titleMatch[1].trim() : parsedUrl.hostname;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: `Could not reach URL: ${msg}` }, { status: 422 });
    }

    // Fetch PageSpeed in parallel with analysis
    const [pageSpeed] = await Promise.all([
      fetchPageSpeed(normalizedUrl),
    ]);

    const seo = analyzeSEO(html, normalizedUrl, pageSpeed);
    const aeo = analyzeAEO(html);
    const geo = analyzeGEO(html, normalizedUrl);

    const result: AuditResult = {
      url: normalizedUrl,
      domain: parsedUrl.hostname,
      auditDate: new Date().toISOString(),
      overallScore: calcOverall(seo.score.score, aeo.score.score, geo.score.score),
      seo,
      aeo,
      geo,
      pageTitle,
      pageSpeed,
    };

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Audit failed: ${msg}` }, { status: 500 });
  }
}
