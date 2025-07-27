import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

interface CityResources {
  food: number;
  wood: number;
  stone: number;
  ore: number;
  gold: number;
}

interface BuildingCosts {
  f?: number; // food
  w?: number; // wood
  s?: number; // stone
  o?: number; // ore
  g?: number; // gold
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; buildingId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, buildingId } = await params;
    const cityId = parseInt(id);
    const playerBuildingId = parseInt(buildingId);

    if (isNaN(cityId) || isNaN(playerBuildingId)) {
      return NextResponse.json({ error: 'Invalid city or building ID' }, { status: 400 });
    }

    logger.info('City upgrade - starting upgrade', { 
      cityId, 
      buildingId: playerBuildingId,
      userId: session.user.id 
    });

    // Get the player building and verify ownership
    const playerBuilding = await prisma.playerBuilding.findFirst({
      where: {
        id: playerBuildingId,
        city: {
          player: {
            userId: session.user.id
          }
        }
      },
      include: {
        building: true,
        city: true
      }
    });

    if (!playerBuilding) {
      return NextResponse.json({ error: 'Building not found or access denied' }, { status: 404 });
    }

    // Check if building is currently under construction
    if (playerBuilding.isConstructing) {
      return NextResponse.json({ error: 'Cannot upgrade building while under construction' }, { status: 400 });
    }

    // Get current city resources
    const cityResources = playerBuilding.city.resources as unknown as CityResources;
    const buildingCosts = playerBuilding.building.costs as BuildingCosts;

    // Check if player has enough resources for upgrade
    for (const [resource, cost] of Object.entries(buildingCosts)) {
      const resourceKey = resource === 'f' ? 'food' : 
                         resource === 'w' ? 'wood' : 
                         resource === 's' ? 'stone' : 
                         resource === 'o' ? 'ore' : 
                         resource === 'g' ? 'gold' : resource;

      if (cityResources[resourceKey as keyof CityResources] < (cost as number)) {
        return NextResponse.json({ 
          error: `Insufficient ${resourceKey}. Required: ${cost}, Available: ${cityResources[resourceKey as keyof CityResources]}` 
        }, { status: 400 });
      }
    }

    // Deduct resources
    const updatedResources = { ...cityResources };
    for (const [resource, cost] of Object.entries(buildingCosts)) {
      const resourceKey = resource === 'f' ? 'food' : 
                         resource === 'w' ? 'wood' : 
                         resource === 's' ? 'stone' : 
                         resource === 'o' ? 'ore' : 
                         resource === 'g' ? 'gold' : resource;
      (updatedResources as Record<string, number>)[resourceKey] -= (cost as number);
    }

    // Update city resources and building level
    await prisma.$transaction([
      prisma.city.update({
        where: { id: cityId },
        data: { resources: updatedResources }
      }),
      prisma.playerBuilding.update({
        where: { id: playerBuildingId },
        data: { level: { increment: 1 } }
      })
    ]);

    logger.info('City upgrade - upgrade successful', { 
      cityId, 
      buildingId: playerBuildingId,
      newLevel: playerBuilding.level + 1,
      userId: session.user.id 
    });

    return NextResponse.json({
      success: true,
      newLevel: playerBuilding.level + 1,
      updatedResources
    });

  } catch (error) {
    logger.error('City upgrade - error upgrading building', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return NextResponse.json({ error: 'Failed to upgrade building' }, { status: 500 });
  }
} 