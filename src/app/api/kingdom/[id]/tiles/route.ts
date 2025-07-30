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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const kingdomId = parseInt(id);

    if (isNaN(kingdomId)) {
      return NextResponse.json({ error: 'Invalid kingdom ID' }, { status: 400 });
    }

    // Get the player's current city to center the view
    const player = await prisma.player.findFirst({
      where: {
        userId: session.user.id,
        kingdomId: kingdomId
      },
      include: {
        cities: {
          include: {
            mapTile: true
          }
        }
      }
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Get the player's current city (or first city if none selected)
    const currentCity = player.cities.find(city => city.id === player.lastCity) || player.cities[0];
    
    // Fetch the current city with its mapTile relation
    const cityWithMapTile = await prisma.city.findUnique({
      where: { id: currentCity.id },
      include: { mapTile: true }
    });
    
    if (!cityWithMapTile) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }
    
    if (!currentCity) {
      return NextResponse.json({ error: 'No city found' }, { status: 404 });
    }

    // Get query parameters for viewport (Camelot-style)
    const url = new URL(request.url);
    const centerX = parseInt(url.searchParams.get('centerX') || cityWithMapTile.mapTile.x.toString());
    const centerY = parseInt(url.searchParams.get('centerY') || cityWithMapTile.mapTile.y.toString());
    const viewportSize = parseInt(url.searchParams.get('viewportSize') || '20');
    
    const minX = centerX - Math.floor(viewportSize / 2);
    const maxX = centerX + Math.floor(viewportSize / 2);
    const minY = centerY - Math.floor(viewportSize / 2);
    const maxY = centerY + Math.floor(viewportSize / 2);

    // Fetch tiles in the viewport
    const tiles = await prisma.mapTile.findMany({
      where: {
        kingdomId: kingdomId,
        x: {
          gte: minX,
          lte: maxX
        },
        y: {
          gte: minY,
          lte: maxY
        }
      },
      include: {
        city: {
          include: {
            player: true
          }
        }
      },
      orderBy: [
        { y: 'asc' },
        { x: 'asc' }
      ]
    });

    // Get all cities in the viewport for city markers
    const cities = tiles
      .filter(tile => tile.city)
      .map(tile => ({
        id: tile.city!.id,
        name: tile.city!.name,
        age: tile.city!.age,
        x: tile.x,
        y: tile.y,
        playerName: tile.city!.player.name,
        playerId: tile.city!.playerId
      }));

    // Ensure the player's current city is always included
    const playerCityInViewport = cities.find(city => city.id === cityWithMapTile.id);
    if (!playerCityInViewport) {
      // Add the player's city to the cities array
      cities.push({
        id: cityWithMapTile.id,
        name: cityWithMapTile.name,
        age: cityWithMapTile.age,
        x: cityWithMapTile.mapTile.x,
        y: cityWithMapTile.mapTile.y,
        playerName: player.name,
        playerId: player.id
      });
    }

    logger.debug('Kingdom tiles - fetched viewport (Camelot-style)', {
      kingdomId,
      centerX,
      centerY,
      viewportSize,
      tileCount: tiles.length,
      cityCount: cities.length,
      userId: session.user.id
    });

    return NextResponse.json({
      tiles: tiles.map(tile => ({
        id: tile.id,
        x: tile.x,
        y: tile.y,
        type: tile.type,
        level: tile.level,
        hasCity: !!tile.city
      })),
      cities,
      viewport: {
        centerX,
        centerY,
        minX,
        maxX,
        minY,
        maxY
      }
    });

  } catch (error) {
    logger.error('Kingdom tiles - error fetching tiles', { 
      kingdomId: String(params), 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return NextResponse.json({ error: 'Failed to fetch kingdom tiles' }, { status: 500 });
  }
} 