import { NextRequest, NextResponse } from 'next/server';

const CRAWLER_USER_AGENTS = [
  'googlebot',
  'bingbot',
  'slackbot',
  'twitterbot',
  'facebookexternalhit',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'discordbot',
  'slack',
  'pinterest',
  'reddit',
  'yandex',
  'duckduckbot',
  'baiduspider',
];

function isCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some(bot => ua.includes(bot));
}

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  const pathname = request.nextUrl.pathname;

  // Check if this is a dynamic route that needs prerendering
  const isNoteRoute = pathname.startsWith('/notes/') && pathname.split('/').length === 3;
  const isAIRoute = pathname.startsWith('/ai/') && pathname.includes('/prompt/');

  // If crawler accessing dynamic route, redirect to prerender function
  if (isCrawler(userAgent)) {
    if (isNoteRoute) {
      const slug = pathname.split('/notes/')[1];
      const prerenderUrl = `https://gjlxuvcfoqjhwzcmpaju.supabase.co/functions/v1/prerender-note/${slug}`;
      return NextResponse.rewrite(new URL(prerenderUrl));
    }

    if (isAIRoute) {
      const parts = pathname.split('/');
      const aiId = parts[2];
      const promptIndex = parts.indexOf('prompt');
      const prompt = parts.slice(promptIndex + 1).join('/');
      const prerenderUrl = `https://gjlxuvcfoqjhwzcmpaju.supabase.co/functions/v1/prerender-ai/${aiId}/${prompt}`;
      return NextResponse.rewrite(new URL(prerenderUrl));
    }
  }

  // For normal users, continue with React SPA
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/notes/:slug*',
    '/ai/:id*/prompt/:prompt*',
  ],
};
