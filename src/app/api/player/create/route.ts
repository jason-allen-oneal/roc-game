import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, gender, avatar } = await req.json();

    // Validate input
    if (!name || !gender || !avatar) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create a kingdom (for now, we'll use the first available kingdom with less than 50 players)
    const kingdoms = await prisma.kingdom.findMany({
      include: { _count: { select: { players: true } } }
    });
    let kingdom = kingdoms.find((k: any) => k._count.players < 50);

    if (!kingdom) {
      // Create a new kingdom if none are available
      const newKingdom = await prisma.kingdom.create({
        data: {
          name: `Kingdom ${Date.now()}`,
        }
      });
      // Add _count property to match the type
      kingdom = { ...newKingdom, _count: { players: 0 } };
    }

    // At this point, kingdom is guaranteed to be defined

    // Create the player
    const player = await prisma.player.create({
      data: {
        name,
        gender,
        avatar,
        userId: session.user.id,
        kingdomId: kingdom.id,
      }
    });

    // Find a random plains tile for the initial city
    const plainsTile = await prisma.mapTile.findFirst({
      where: {
        kingdomId: kingdom.id,
        type: 'plains',
        city: null
      }
    });

    if (!plainsTile) {
      // If no plains tile is available, create one
      const newTile = await prisma.mapTile.create({
        data: {
          kingdomId: kingdom.id,
          type: 'plains',
          x: Math.floor(Math.random() * 100),
          y: Math.floor(Math.random() * 100),
          resources: {
            food: 100,
            wood: 100,
            stone: 50,
            gold: 50
          }
        }
      });

      // Create the initial city
      await prisma.city.create({
        data: {
          name: `${name}'s Capital`,
          playerId: player.id,
          mapTileId: newTile.id,
          resources: {
            food: 100,
            wood: 100,
            stone: 50,
            gold: 50
          },
          buildings: {
            townHall: 1,
            houses: 5,
            farms: 2
          }
        }
      });
    }

    return NextResponse.json({ success: true, player });
  } catch (error) {
    console.error('Error creating player:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 