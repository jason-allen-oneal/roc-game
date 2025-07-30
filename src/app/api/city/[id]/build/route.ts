import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

interface BuildRequest {
  buildingSlug: string;
  plotId: string | null;
}

interface Building {
  id: number;
  name: string;
  slug: string;
  constructionTime: number;
  costs: Record<string, number>;
  requirements: Record<string, unknown>;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const cityId = parseInt(id);

    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    const body: BuildRequest = await request.json();
    const { buildingSlug, plotId } = body;

    if (!buildingSlug) {
      return NextResponse.json({ error: 'Missing buildingSlug' }, { status: 400 });
    }

    // Wall buildings don't require a plotId
    if (buildingSlug !== 'wall' && !plotId) {
      return NextResponse.json({ error: 'Missing plotId' }, { status: 400 });
    }

    logger.info('City build - starting construction', { 
      cityId, 
      buildingSlug, 
      plotId: plotId || 'null',
      userId: session.user.id 
    });

    // Get the building data
    const building = await prisma.building.findFirst({
      where: { slug: buildingSlug }
    }) as Building | null;

    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 });
    }

    // Get the city and verify ownership
    const city = await prisma.city.findFirst({
      where: {
        id: cityId,
        player: {
          userId: session.user.id
        }
      },
      include: {
        player: true,
        playerResearch: {
          include: {
            research: true
          }
        }
      }
    });

    if (!city) {
      return NextResponse.json({ error: 'City not found or access denied' }, { status: 404 });
    }

    // Check if there's already a building under construction in this city
    const now = new Date();
    const existingConstruction = await prisma.playerBuilding.findFirst({
      where: {
        cityId: cityId,
        isConstructing: true,
        constructionEndsAt: {
          gt: now // Only consider buildings that haven't finished construction yet
        }
      },
      include: {
        building: true
      }
    });

    if (existingConstruction) {
      return NextResponse.json({ 
        error: `Cannot start construction: ${existingConstruction.building?.name || 'Another building'} is already under construction` 
      }, { status: 400 });
    }

    // Check if this plot already has a building (skip for wall buildings)
    if (buildingSlug !== 'wall' && plotId) {
      const existingBuilding = await prisma.playerBuilding.findFirst({
        where: {
          cityId: cityId,
          plotId: plotId as string
        }
      });

      if (existingBuilding) {
        return NextResponse.json({ error: 'Plot already has a building' }, { status: 400 });
      }
    }

    // Soft unique check for specific building types
    if (['towncenter', 'smith', 'academy', 'market', 'arena', 'wall', 'tower', 'storage'].includes(buildingSlug)) {
      const existingBuildingOfType = await prisma.playerBuilding.findFirst({
        where: {
          cityId: cityId,
          building: {
            slug: buildingSlug
          }
        }
      });

      if (existingBuildingOfType) {
        return NextResponse.json({ error: `Cannot build ${building.name}: Only one allowed per city` }, { status: 400 });
      }
    }

    // Calculate research bonuses for construction
    const architectureResearch = city.playerResearch.find(pr => pr.research.slug === 'architecture');
    const architectureLevel = architectureResearch?.level || 0;
    const architectureBonus = architectureLevel > 0 && architectureResearch ? 
      (architectureResearch.research.baseValue + (architectureLevel - 1) * architectureResearch.research.bonusValue) : 0;
    
    // Apply construction time reduction from Architecture research
    const constructionTimeReduction = architectureBonus / 100; // Convert percentage to decimal
    const adjustedConstructionTime = Math.max(
      building.constructionTime * (1 - constructionTimeReduction), 
      building.constructionTime * 0.5 // Minimum 50% of original time
    );

    logger.debug('City build - construction time calculation', {
      buildingSlug,
      originalTime: building.constructionTime,
      architectureLevel,
      architectureBonus,
      constructionTimeReduction,
      adjustedConstructionTime
    });

    // Calculate construction times
    const constructionStartedAt = new Date();
    const constructionEndsAt = new Date(constructionStartedAt.getTime() + (adjustedConstructionTime * 1000));

    // Create the player building
    const playerBuilding = await prisma.playerBuilding.create({
      data: {
        playerId: city.playerId,
        buildingId: building.id,
        cityId: cityId,
        plotId: buildingSlug === 'wall' ? null : (plotId as string), // Wall doesn't use a plot
        level: 1,
        isConstructing: true,
        constructionStartedAt: constructionStartedAt,
        constructionEndsAt: constructionEndsAt
      },
      include: {
        building: true
      }
    });

    logger.info('City build - construction started successfully', { 
      cityId, 
      buildingId: building.id,
      buildingSlug,
      plotId: String(plotId || 'null'),
      constructionStartedAt: constructionStartedAt.toISOString(),
      constructionEndsAt: constructionEndsAt.toISOString(),
      userId: session.user.id 
    });

    return NextResponse.json({
      success: true,
      buildingId: playerBuilding.id,
      constructionStartedAt: constructionStartedAt.toISOString(),
      constructionEndsAt: constructionEndsAt.toISOString()
    });

  } catch (error) {
    logger.error('City build - error starting construction', { 
      cityId: String(params), 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return NextResponse.json({ error: 'Failed to start construction' }, { status: 500 });
  }
} 