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
    const cityId = parseInt(id);

    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
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
        mapTile: true,
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

    const now = new Date();

    // Get all buildings for this city
    const buildings = await prisma.playerBuilding.findMany({
      where: {
        cityId: cityId
      },
      include: {
        building: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    // ALWAYS GENERATE RESOURCES ON EVERY POLL
    const resourceBuildings = buildings.filter(b => 
      ['farm', 'lumbermill', 'quarry', 'mine', 'market'].includes(b.building.slug) && 
      !b.isConstructing
    );

    logger.debug('City poll - resource generation check', {
      cityId,
      totalBuildings: buildings.length,
      resourceBuildings: resourceBuildings.map(b => ({
        name: b.building.name,
        slug: b.building.slug,
        level: b.level,
        isConstructing: b.isConstructing,
        baseValue: b.building.baseValue,
        bonusValue: b.building.bonusValue
      })),
      userId: session.user.id
    });

    const generationAmounts: Record<string, number> = {
      food: 0,
      wood: 0,
      stone: 0,
      ore: 0,
      gold: 0
    };

    // BASE RESOURCE GENERATION - 1 per second
    const baseGeneration = {
      food: 1,
      wood: 1,
      stone: 1,
      ore: 1,
      gold: 1
    };

    // Add base generation to all cities
    generationAmounts.food += baseGeneration.food;
    generationAmounts.wood += baseGeneration.wood;
    generationAmounts.stone += baseGeneration.stone;
    generationAmounts.ore += baseGeneration.ore;
    generationAmounts.gold += baseGeneration.gold;

    // Calculate research bonuses for resource production
    const farmingResearch = city.playerResearch.find(pr => pr.research.slug === 'farming');
    const woodworkingResearch = city.playerResearch.find(pr => pr.research.slug === 'woodworking');
    const miningResearch = city.playerResearch.find(pr => pr.research.slug === 'mining');

    // Research bonuses are percentages: baseValue + (level-1) * bonusValue
    const farmingBonus = farmingResearch ? 
      (farmingResearch.research.baseValue + (farmingResearch.level - 1) * farmingResearch.research.bonusValue) / 100 : 0;
    const woodworkingBonus = woodworkingResearch ? 
      (woodworkingResearch.research.baseValue + (woodworkingResearch.level - 1) * woodworkingResearch.research.bonusValue) / 100 : 0;
    const miningBonus = miningResearch ? 
      (miningResearch.research.baseValue + (miningResearch.level - 1) * miningResearch.research.bonusValue) / 100 : 0;

    logger.debug('City poll - research bonuses calculated', {
      cityId,
      farmingResearch: farmingResearch ? {
        level: farmingResearch.level,
        baseValue: farmingResearch.research.baseValue,
        bonusValue: farmingResearch.research.bonusValue,
        totalBonus: farmingBonus
      } : null,
      woodworkingResearch: woodworkingResearch ? {
        level: woodworkingResearch.level,
        baseValue: woodworkingResearch.research.baseValue,
        bonusValue: woodworkingResearch.research.bonusValue,
        totalBonus: woodworkingBonus
      } : null,
      miningResearch: miningResearch ? {
        level: miningResearch.level,
        baseValue: miningResearch.research.baseValue,
        bonusValue: miningResearch.research.bonusValue,
        totalBonus: miningBonus
      } : null,
      userId: session.user.id
    });

    resourceBuildings.forEach(building => {
      const baseProduction = building.building.baseValue;
      const bonusProduction = building.building.bonusValue * (building.level - 1);
      const totalProduction = baseProduction + bonusProduction;

      logger.debug('City poll - building production calculation', {
        cityId,
        buildingName: building.building.name,
        buildingSlug: building.building.slug,
        level: building.level,
        baseProduction,
        bonusProduction,
        totalProduction,
        researchBonus: building.building.slug === 'farm' ? farmingBonus : 
                      building.building.slug === 'lumbermill' ? woodworkingBonus :
                      building.building.slug === 'quarry' || building.building.slug === 'mine' ? miningBonus : 0
      });

      // Apply research bonuses
      let finalProduction = totalProduction;
      switch (building.building.slug) {
        case 'farm':
          finalProduction = Math.floor(totalProduction * (1 + farmingBonus));
          generationAmounts.food += finalProduction;
          break;
        case 'lumbermill':
          finalProduction = Math.floor(totalProduction * (1 + woodworkingBonus));
          generationAmounts.wood += finalProduction;
          break;
        case 'quarry':
          finalProduction = Math.floor(totalProduction * (1 + miningBonus));
          generationAmounts.stone += finalProduction;
          break;
        case 'mine':
          finalProduction = Math.floor(totalProduction * (1 + miningBonus));
          generationAmounts.ore += finalProduction;
          break;
        case 'market':
          finalProduction = totalProduction;
          generationAmounts.gold += finalProduction;
          break;
      }

      logger.debug('City poll - final production calculation', {
        cityId,
        buildingName: building.building.name,
        buildingSlug: building.building.slug,
        level: building.level,
        baseProduction,
        bonusProduction,
        totalProduction,
        researchBonus: building.building.slug === 'farm' ? farmingBonus : 
                      building.building.slug === 'lumbermill' ? woodworkingBonus :
                      building.building.slug === 'quarry' || building.building.slug === 'mine' ? miningBonus : 0,
        finalProduction,
        resourceType: building.building.slug === 'farm' ? 'food' :
                     building.building.slug === 'lumbermill' ? 'wood' :
                     building.building.slug === 'quarry' ? 'stone' :
                     building.building.slug === 'mine' ? 'ore' : 'gold'
      });
    });

    // Calculate offline resource generation
    let offlineGeneration = { food: 0, wood: 0, stone: 0, ore: 0, gold: 0 };
    const lastGeneration = city.lastResourceGeneration;
    
    if (lastGeneration) {
      const timeSinceLastGeneration = now.getTime() - lastGeneration.getTime();
      const secondsSinceLastGeneration = Math.floor(timeSinceLastGeneration / 1000);
      
      if (secondsSinceLastGeneration > 2) {
        // Player was offline, calculate offline generation
        const offlinePolls = Math.floor(secondsSinceLastGeneration / 2);
        
        // Calculate offline generation (same as current generation)
        offlineGeneration = {
          food: baseGeneration.food * offlinePolls,
          wood: baseGeneration.wood * offlinePolls,
          stone: baseGeneration.stone * offlinePolls,
          ore: baseGeneration.ore * offlinePolls,
          gold: baseGeneration.gold * offlinePolls
        };

        // Add building production for offline time
        resourceBuildings.forEach(building => {
          const baseProduction = building.building.baseValue;
          const bonusProduction = building.building.bonusValue * (building.level - 1);
          const totalProduction = baseProduction + bonusProduction;

          // Apply research bonuses
          let finalProduction = totalProduction;
          switch (building.building.slug) {
            case 'farm':
              finalProduction = Math.floor(totalProduction * (1 + farmingBonus));
              offlineGeneration.food += finalProduction * offlinePolls;
              break;
            case 'lumbermill':
              finalProduction = Math.floor(totalProduction * (1 + woodworkingBonus));
              offlineGeneration.wood += finalProduction * offlinePolls;
              break;
            case 'quarry':
              finalProduction = Math.floor(totalProduction * (1 + miningBonus));
              offlineGeneration.stone += finalProduction * offlinePolls;
              break;
            case 'mine':
              finalProduction = Math.floor(totalProduction * (1 + miningBonus));
              offlineGeneration.ore += finalProduction * offlinePolls;
              break;
            case 'market':
              finalProduction = totalProduction;
              offlineGeneration.gold += finalProduction * offlinePolls;
              break;
          }
        });

        logger.info('City poll - offline generation calculated', {
          cityId,
          secondsSinceLastGeneration,
          offlinePolls,
          offlineGeneration: JSON.stringify(offlineGeneration),
          userId: session.user.id
        });
      }
    }

    // Update city resources EVERY POLL (current + offline)
    const currentResources = city.resources as Record<string, number> || {};
    const updatedResources = {
      food: (currentResources.food || 0) + generationAmounts.food + offlineGeneration.food,
      wood: (currentResources.wood || 0) + generationAmounts.wood + offlineGeneration.wood,
      stone: (currentResources.stone || 0) + generationAmounts.stone + offlineGeneration.stone,
      ore: (currentResources.ore || 0) + generationAmounts.ore + offlineGeneration.ore,
      gold: (currentResources.gold || 0) + generationAmounts.gold + offlineGeneration.gold
    };

    // Update the city with new resources EVERY POLL
    await prisma.city.update({
      where: { id: cityId },
      data: {
        resources: updatedResources,
        lastResourceGeneration: now
      }
    });

    const generation = {
      amounts: generationAmounts,
      timestamp: now.toISOString()
    };

    logger.info('City poll - resources generated EVERY POLL', {
      cityId,
      baseGeneration: JSON.stringify(baseGeneration),
      buildingGeneration: JSON.stringify(generationAmounts),
      offlineGeneration: JSON.stringify(offlineGeneration),
      totalGeneration: JSON.stringify({
        food: generationAmounts.food + offlineGeneration.food,
        wood: generationAmounts.wood + offlineGeneration.wood,
        stone: generationAmounts.stone + offlineGeneration.stone,
        ore: generationAmounts.ore + offlineGeneration.ore,
        gold: generationAmounts.gold + offlineGeneration.gold
      }),
      currentResources: JSON.stringify(city.resources),
      updatedResources: JSON.stringify(updatedResources),
      researchBonuses: JSON.stringify({
        farming: farmingBonus,
        woodworking: woodworkingBonus,
        mining: miningBonus
      }),
      userId: session.user.id
    });

    // Get constructing buildings (timers)
    const constructingBuildings = await prisma.playerBuilding.findMany({
      where: {
        cityId: cityId,
        isConstructing: true,
        constructionEndsAt: {
          gt: now
        }
      },
      include: {
        building: true
      }
    });

    // Get all research for this city
    const allResearch = await prisma.playerResearch.findMany({
      where: {
        cityId: cityId
      },
      include: {
        research: true
      }
    });

    // Get active research (timers)
    const activeResearch = allResearch.filter(pr => 
      pr.isResearching && pr.researchEndsAt && new Date(pr.researchEndsAt) > now
    );

    // Get kingdom map tiles around the player's city
    const viewportSize = 20; // 20x20 tile viewport
    const centerX = city.mapTileId % 1000; // Extract X from mapTileId
    const centerY = Math.floor(city.mapTileId / 1000); // Extract Y from mapTileId
    
    const minX = Math.max(0, centerX - Math.floor(viewportSize / 2));
    const maxX = Math.min(999, centerX + Math.floor(viewportSize / 2));
    const minY = Math.max(0, centerY - Math.floor(viewportSize / 2));
    const maxY = Math.min(999, centerY + Math.floor(viewportSize / 2));

    const mapTiles = await prisma.mapTile.findMany({
      where: {
        kingdomId: city.player.kingdomId,
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
      }
    });

    // Map tiles are fetched fresh every poll - no need to update cache
    // The kingdom map will get updated data every 2 seconds

    // Return EVERYTHING in one unified response
    const response = {
      city: {
        ...city,
        resources: updatedResources // Use the updated resources
      },
      buildings,
      generation,
      research: allResearch,
      timers: {
        constructing: constructingBuildings,
        research: activeResearch
      },
      // Additional data for complete city state
      resourceBuildings: resourceBuildings.map(b => ({
        id: b.id,
        name: b.building.name,
        slug: b.building.slug,
        level: b.level,
        production: b.building.baseValue + (b.building.bonusValue * (b.level - 1))
      })),
      researchBonuses: {
        farming: farmingBonus,
        woodworking: woodworkingBonus,
        mining: miningBonus
      },
      cityStats: {
        totalBuildings: buildings.length,
        resourceBuildings: resourceBuildings.length,
        constructingBuildings: constructingBuildings.length,
        activeResearch: activeResearch.length,
        totalResearch: allResearch.length
      },
      // Kingdom map data
      kingdomMap: {
        tiles: mapTiles.map(tile => ({
          id: tile.id,
          type: tile.type,
          x: tile.x,
          y: tile.y,
          level: tile.level,
          city: tile.city ? {
            id: tile.city.id,
            name: tile.city.name,
            age: tile.city.age,
            playerName: tile.city.player.name
          } : null
        })),
        viewport: {
          centerX,
          centerY,
          minX,
          maxX,
          minY,
          maxY,
          size: viewportSize
        }
      }
    };

    logger.debug('City poll - unified response sent', {
      cityId,
      buildingCount: buildings.length,
      hasGeneration: !!generation,
      constructingCount: constructingBuildings.length,
      researchCount: allResearch.length,
      activeResearchCount: activeResearch.length,
      userId: session.user.id
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('City poll - error fetching unified data', {
      cityId: String(params),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json({ error: 'Failed to fetch city data' }, { status: 500 });
  }
} 