import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(session.user);
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      include: { players: true }
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
        return NextResponse.json(lastPlayer);
      }
    }

    // Fallback to the first player if no lastPlayedKingdom or player not found
    return NextResponse.json(user.players[0]);
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 