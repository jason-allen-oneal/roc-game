import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

export async function GET() {
  try {
    const research = await prisma.research.findMany({
      orderBy: {
        id: 'asc'
      }
    });

    logger.debug('Research API - fetched research data', { count: research.length });
    
    return NextResponse.json(research);
  } catch (error) {
    logger.error('Research API - error fetching research', { error: String(error) });
    return NextResponse.json(
      { error: 'Failed to fetch research data' },
      { status: 500 }
    );
  }
} 