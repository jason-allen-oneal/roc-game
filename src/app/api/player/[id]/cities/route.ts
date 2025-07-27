import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  logger.apiRequest('GET', `/api/player/[id]/cities`, { playerId: id });
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const playerId = parseInt(id);
    
    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 });
    }

    logger.debug('Cities API - looking for player', { playerId, userId: session.user.id });

    // Verify the player belongs to the authenticated user
    const player = await prisma.player.findFirst({
      where: {
        id: playerId,
        userId: session.user.id
      }
    });

    logger.debug('Cities API - player lookup result', { playerFound: !!player, playerId });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Fetch cities for this player
    const cities = await prisma.city.findMany({
      where: {
        playerId: playerId
      },
      include: {
        mapTile: true
      }
    });

    logger.info('Cities API - cities found', { playerId, cityCount: cities.length });

    return NextResponse.json(cities);
  } catch (error) {
    logger.error('Cities API - error fetching cities', { playerId: id, error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 