import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  logger.info('Cities API - request received', { playerId: id });
  
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
    logger.error('Cities API - error fetching cities', { 
      playerId: id, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const playerId = parseInt(id);

    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 });
    }

    const body = await request.json();
    const { lastCity } = body;

    if (!lastCity || typeof lastCity !== 'number') {
      return NextResponse.json({ error: 'Invalid lastCity parameter' }, { status: 400 });
    }

    // Verify the player belongs to the current user
    const player = await prisma.player.findFirst({
      where: {
        id: playerId,
        userId: session.user.id
      },
      include: {
        cities: true
      }
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Verify the city belongs to this player
    const city = player.cities.find(c => c.id === lastCity);
    if (!city) {
      return NextResponse.json({ error: 'City not found or does not belong to player' }, { status: 404 });
    }

    // Update the player's lastCity
    await prisma.player.update({
      where: { id: playerId },
      data: { lastCity }
    });

    logger.debug('Player cities - updated lastCity', {
      playerId,
      lastCity,
      userId: session.user.id
    });

    return NextResponse.json({ success: true, lastCity });
  } catch (error) {
    logger.error('Player cities - error updating lastCity', { 
      playerId: String(params), 
      error: String(error) 
    });
    return NextResponse.json({ error: 'Failed to update lastCity' }, { status: 500 });
  }
} 