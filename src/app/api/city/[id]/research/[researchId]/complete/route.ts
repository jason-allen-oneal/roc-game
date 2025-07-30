import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; researchId: string }> }
) {
  try {
    const { id, researchId: researchIdParam } = await params;
    const cityId = parseInt(id);
    const researchId = parseInt(researchIdParam);

    // Find the player research record
    const playerResearch = await prisma.playerResearch.findFirst({
      where: {
        cityId: cityId,
        researchId: researchId,
        isResearching: true
      },
      include: {
        research: true
      }
    });

    if (!playerResearch) {
      return NextResponse.json(
        { error: 'Research not found or not in progress' },
        { status: 404 }
      );
    }

    // Check if research time has elapsed
    if (playerResearch.researchEndsAt && new Date() < playerResearch.researchEndsAt) {
      return NextResponse.json(
        { error: 'Research is not yet complete' },
        { status: 400 }
      );
    }

    // Mark research as complete (level is already incremented when research started)
    const updatedResearch = await prisma.playerResearch.update({
      where: {
        id: playerResearch.id
      },
      data: {
        isResearching: false,
        researchStartedAt: null,
        researchEndsAt: null
      },
      include: {
        research: true
      }
    });

    logger.debug('Research API - research completed', {
      researchId,
      cityId,
      researchName: updatedResearch.research.name
    });

    return NextResponse.json(updatedResearch);
  } catch (error) {
    logger.error('Research API - error completing research', { error: String(error) });
    return NextResponse.json(
      { error: 'Failed to complete research' },
      { status: 500 }
    );
  }
} 