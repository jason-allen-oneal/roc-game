import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cityId = parseInt(id);
    const { researchId } = await request.json();

    if (!researchId) {
      return NextResponse.json(
        { error: 'Research ID is required' },
        { status: 400 }
      );
    }

    // Get the research data
    const research = await prisma.research.findUnique({
      where: { id: researchId }
    });

    if (!research) {
      return NextResponse.json(
        { error: 'Research not found' },
        { status: 404 }
      );
    }

    // Get the city and player data
    const city = await prisma.city.findUnique({
      where: { id: cityId },
      include: {
        player: true,
        playerBuildings: {
          include: {
            building: true
          }
        },
        playerResearch: {
          include: {
            research: true
          }
        }
      }
    });

    if (!city) {
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      );
    }

    // Check if player already has this research
    const existingResearch = city.playerResearch.find(
      pr => pr.researchId === researchId
    );

    // Check if research is already at max level (25)
    if (existingResearch && existingResearch.level >= 25) {
      return NextResponse.json(
        { error: 'Research already at maximum level (25)' },
        { status: 400 }
      );
    }

    // If research exists but is not at max level, we can upgrade it
    const isUpgrade = existingResearch && existingResearch.level < 25;

    // Check if academy building exists and is high enough level
    const academy = city.playerBuildings.find(
      pb => pb.building.slug === 'academy'
    );

    if (!academy) {
      return NextResponse.json(
        { error: 'Academy building required to start research' },
        { status: 400 }
      );
    }

    // Check research requirements
    const requirements = research.requirements as Record<string, unknown> || {};
    
    // Check age requirement
    if (requirements.age && city.age < (requirements.age as number)) {
      return NextResponse.json(
        { error: `Research requires city age ${requirements.age}` },
        { status: 400 }
      );
    }

    // Check building requirements
    if (requirements.buildings) {
      const buildingReqs = requirements.buildings as Record<string, number>;
      for (const [buildingSlug, requiredLevel] of Object.entries(buildingReqs)) {
        const building = city.playerBuildings.find(
          pb => pb.building.slug === buildingSlug
        );
        if (!building || building.level < requiredLevel) {
          return NextResponse.json(
            { error: `Research requires ${buildingSlug} level ${requiredLevel}` },
            { status: 400 }
          );
        }
      }
    }

    // Check research requirements
    if (requirements.research) {
      const researchReqs = requirements.research as Record<string, number>;
      for (const [researchSlug, requiredLevel] of Object.entries(researchReqs)) {
        const playerResearch = city.playerResearch.find(
          pr => pr.research.slug === researchSlug
        );
        if (!playerResearch || playerResearch.level < requiredLevel) {
          return NextResponse.json(
            { error: `Research requires ${researchSlug} level ${requiredLevel}` },
            { status: 400 }
          );
        }
      }
    }

    // Check if player can afford the research costs
    const costs = research.costs as Record<string, number> || {};
    const requiredFood = costs.f || 0;
    const requiredWood = costs.w || 0;
    const requiredStone = costs.s || 0;
    const requiredOre = costs.o || 0;
    const requiredGold = costs.g || 0;

    const cityResources = city.resources as Record<string, number> || {};
    const currentFood = cityResources.food || 0;
    const currentWood = cityResources.wood || 0;
    const currentStone = cityResources.stone || 0;
    const currentOre = cityResources.ore || 0;
    const currentGold = cityResources.gold || 0;

    if (currentFood < requiredFood ||
        currentWood < requiredWood ||
        currentStone < requiredStone ||
        currentOre < requiredOre ||
        currentGold < requiredGold) {
      return NextResponse.json(
        { error: 'Insufficient resources to start research' },
        { status: 400 }
      );
    }

    // Calculate research time (using research.researchTime)
    const researchTime = research.researchTime || 300; // Default to 5 minutes if not set

    logger.debug('Research API - research time calculation', {
      researchId,
      researchName: research.name,
      researchTime: research.researchTime,
      finalResearchTime: researchTime
    });

    const researchEndsAt = new Date(Date.now() + researchTime * 1000);

    // Deduct resources from city
    const updatedResources = {
      food: currentFood - requiredFood,
      wood: currentWood - requiredWood,
      stone: currentStone - requiredStone,
      ore: currentOre - requiredOre,
      gold: currentGold - requiredGold
    };

    // Update city resources
    await prisma.city.update({
      where: { id: cityId },
      data: { resources: updatedResources }
    });

    let playerResearch;

    if (isUpgrade) {
      // Update existing research
      playerResearch = await prisma.playerResearch.update({
        where: {
          id: existingResearch.id
        },
        data: {
          level: existingResearch.level + 1,
          isResearching: true,
          researchStartedAt: new Date(),
          researchEndsAt: researchEndsAt
        },
        include: {
          research: true
        }
      });
    } else {
      // Create new research
      playerResearch = await prisma.playerResearch.create({
        data: {
          playerId: city.playerId,
          researchId: researchId,
          cityId: cityId,
          level: 1,
          isResearching: true,
          researchStartedAt: new Date(),
          researchEndsAt: researchEndsAt
        },
        include: {
          research: true
        }
      });
    }

    logger.debug('Research API - started research', {
      researchId,
      cityId,
      researchTime,
      researchEndsAt: researchEndsAt.toISOString()
    });

    return NextResponse.json(playerResearch);
  } catch (error) {
    logger.error('Research API - error starting research', { error: String(error) });
    return NextResponse.json(
      { error: 'Failed to start research' },
      { status: 500 }
    );
  }
} 