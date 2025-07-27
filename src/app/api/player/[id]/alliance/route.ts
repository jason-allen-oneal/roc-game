import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const playerId = parseInt(id);

    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 });
    }

    // Validate that the player belongs to the authenticated user
    const player = await prisma.player.findFirst({
      where: {
        id: playerId,
        user: {
          email: session.user.email
        }
      },
      include: {
        allianceMembership: {
          include: {
            alliance: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const hasAlliance = !!player.allianceMembership;
    const allianceName = player.allianceMembership?.alliance.name || '';

    logger.debug('Alliance check', { 
      playerId, 
      hasAlliance, 
      allianceName 
    });

    return NextResponse.json({
      hasAlliance,
      allianceName,
      allianceId: player.allianceMembership?.alliance.id || null
    });

  } catch (error) {
    logger.error('Failed to check alliance membership', { error });
    return NextResponse.json({ error: 'Failed to check alliance membership' }, { status: 500 });
  }
} 