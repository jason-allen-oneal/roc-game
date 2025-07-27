import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

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

    logger.info('City demolish - starting demolition', { 
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
      return NextResponse.json({ error: 'Cannot demolish building while under construction' }, { status: 400 });
    }

    // Prevent demolition of Town Center (level 1)
    if (playerBuilding.building.slug === 'towncenter' && playerBuilding.level === 1) {
      return NextResponse.json({ error: 'Cannot demolish the Town Center' }, { status: 400 });
    }

    // Delete the building
    await prisma.playerBuilding.delete({
      where: { id: playerBuildingId }
    });

    logger.info('City demolish - demolition successful', { 
      cityId, 
      buildingId: playerBuildingId,
      buildingName: playerBuilding.building.name,
      userId: session.user.id 
    });

    return NextResponse.json({
      success: true,
      message: `${playerBuilding.building.name} has been demolished`
    });

  } catch (error) {
    logger.error('City demolish - error demolishing building', { 
      cityId: params, 
      buildingId: params,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return NextResponse.json({ error: 'Failed to demolish building' }, { status: 500 });
  }
} 