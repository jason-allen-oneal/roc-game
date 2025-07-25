import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

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

    // Use the user ID directly from the session
    const userId = session.user.id;

    // Get or create a kingdom (for now, we'll use the first available kingdom with less than 50 players)
    const kingdoms = await prisma.kingdom.findMany({
      include: { _count: { select: { players: true } } }
    });
    let kingdom = kingdoms.find((k) => k._count.players < 500);

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

    // Check if player already exists for this user in this kingdom
    const existingPlayer = await prisma.player.findUnique({
      where: {
        userId_kingdomId: {
          userId: userId,
          kingdomId: kingdom.id
        }
      }
    });

    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Player already exists in this kingdom' },
        { status: 400 }
      );
    }

    // Create the player
    const player = await prisma.player.create({
      data: {
        name,
        gender,
        avatar,
        userId: userId,
        kingdomId: kingdom.id,
      }
    });

    // Find a random plains tile for the initial city
    const plainsTile = await prisma.mapTile.findFirst({
      where: {
        kingdomId: kingdom.id,
        type: 'PLAINS',
        city: null
      }
    });

    if (!plainsTile) {
      // If no plains tile is available, create one
      const newTile = await prisma.mapTile.create({
        data: {
          kingdomId: kingdom.id,
          type: 'PLAINS',
          x: Math.floor(Math.random() * 100),
          y: Math.floor(Math.random() * 100),
          level: 1
        }
      });

      // Create the initial city
      const city = await prisma.city.create({
        data: {
          name: `${name}'s Capital`,
          playerId: player.id,
          mapTileId: newTile.id,
          age: 1,
          population: 100,
          resources: {
            food: 2000,
            wood: 2000,
            stone: 2000,
            gold: 500
          }
        }
      });

      // Create town center building for the new city
      const townCenterBuilding = await prisma.building.findUnique({
        where: { slug: 'towncenter' }
      });

      if (townCenterBuilding) {
        await prisma.playerBuilding.create({
          data: {
            playerId: player.id,
            buildingId: townCenterBuilding.id,
            cityId: city.id,
            level: 1
          }
        });
      }

      console.log('City created:', city.id);
    } else {
      // Create the initial city on the existing plains tile
      const city = await prisma.city.create({
        data: {
          name: `${name}'s Capital`,
          playerId: player.id,
          mapTileId: plainsTile.id,
          age: 1,
          population: 100,
          resources: {
            food: 2000,
            wood: 2000,
            stone: 2000,
            gold: 2000
          }
        }
      });

      // Create town center building for the new city
      const townCenterBuilding = await prisma.building.findUnique({
        where: { slug: 'towncenter' }
      });

      if (townCenterBuilding) {
        await prisma.playerBuilding.create({
          data: {
            playerId: player.id,
            buildingId: townCenterBuilding.id,
            cityId: city.id,
            level: 1
          }
        });
      }

      console.log('City created:', city.id);
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