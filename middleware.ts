import { NextResponse } from 'next/server';
export const config = { matcher: ['/api/:path*'] };

const WINDOW = 10_000; // 10 seconds
const LIMIT = 8;       // max 8 API calls per window per IP
const buckets = new Map<string, { count: number; resetAt: number }>();

export function middleware(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') || 'anon').split(',')[0].trim();
  const now = Date.now();
  const b = buckets.get(ip) ?? { count: 0, resetAt: now + WINDOW };
  if (now > b.resetAt) { b.count = 0; b.resetAt = now + WINDOW; }
  b.count++;
  buckets.set(ip, b);
  if (b.count > LIMIT) {
    return new NextResponse(JSON.stringify({ error: 'Rate limit' }), { status: 429 });
  }
  return NextResponse.next();
}
