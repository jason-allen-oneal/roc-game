import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import logger from '@/lib/logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  logger.apiRequest('GET', `/api/city/[id]/data`, { params: await params });
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const cityId = parseInt(id);
    
    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get city with player info
    const city = await prisma.city.findUnique({
      where: { id: cityId },
      include: {
        player: true
      }
    });

    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    // Check if user owns this city
    if (city.player.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all player buildings for this city
    const playerBuildings = await prisma.playerBuilding.findMany({
      where: {
        cityId: cityId
      },
      include: {
        building: true
      }
    });

    // Get city age (for now default to 1, could be calculated based on city creation date)
    const cityAge = 1;

    // Return unified city data
    return NextResponse.json({
      city: {
        id: city.id,
        name: city.name,
        playerId: city.playerId,
        mapTileId: city.mapTileId,
        population: city.population,
        resources: city.resources,
        age: cityAge,
        createdAt: city.createdAt
      },
      buildings: playerBuildings,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching city data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 