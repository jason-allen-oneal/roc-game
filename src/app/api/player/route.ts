import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.debug('Session user data', { 
      id: session.user.id, 
      email: session.user.email 
    });
    
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      include: { players: true }
    });

    logger.debug('Found user data', { 
      userId: user?.id, 
      playerCount: user?.players?.length 
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.players || user.players.length === 0) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // If user has a lastPlayedKingdom, find that specific player
    if (user.lastPlayedKingdom) {
      const lastPlayer = user.players.find(player => player.kingdomId === user.lastPlayedKingdom);
      if (lastPlayer) {
        // Fetch the player with cities
        const playerWithCities = await prisma.player.findUnique({
          where: { id: lastPlayer.id },
          include: {
            cities: {
              orderBy: { createdAt: 'asc' }
            }
          }
        });
        return NextResponse.json(playerWithCities);
      }
    }

    // Fallback to the first player if no lastPlayedKingdom or player not found
    const firstPlayer = user.players[0];
    const playerWithCities = await prisma.player.findUnique({
      where: { id: firstPlayer.id },
      include: {
        cities: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    return NextResponse.json(playerWithCities);
  } catch (error) {
    logger.error('Error fetching player', { error: String(error) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 