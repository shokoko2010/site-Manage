import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      message: 'Zex-Content API is running',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=5'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Health check failed' },
      { status: 500 }
    );
  }
}