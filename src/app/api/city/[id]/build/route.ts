import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { buildingSlug, plotId } = await request.json();

    if (!buildingSlug || !plotId) {
      return NextResponse.json({ error: 'Missing buildingSlug or plotId' }, { status: 400 });
    }

    // Get the building details
    const building = await prisma.building.findUnique({
      where: { slug: buildingSlug }
    });

    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 });
    }

    // Get the city and check if player owns it
    const city = await prisma.city.findUnique({
      where: { id: cityId },
      include: { player: true }
    });

    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    // Check if user owns this city
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || city.player.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if player has enough resources
    const cityResources = city.resources as any;
    const buildingCosts = building.costs as any;

    // Check each required resource
    for (const [resource, cost] of Object.entries(buildingCosts)) {
      const resourceKey = resource === 'f' ? 'food' : 
                         resource === 'w' ? 'wood' : 
                         resource === 's' ? 'stone' : 
                         resource === 'o' ? 'ore' : 
                         resource === 'g' ? 'gold' : resource;
      
      if (cityResources[resourceKey] < (cost as number)) {
        return NextResponse.json({ 
          error: `Insufficient ${resourceKey}. Required: ${cost}, Available: ${cityResources[resourceKey]}` 
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
      updatedResources[resourceKey] -= (cost as number);
    }

    // Update city resources
    await prisma.city.update({
      where: { id: cityId },
      data: { resources: updatedResources }
    });

    // Create the player building
    const playerBuilding = await prisma.playerBuilding.create({
      data: {
        playerId: city.playerId,
        buildingId: building.id,
        cityId: cityId,
        level: 1,
        isConstructing: true,
        constructionStartedAt: new Date(),
        constructionEndsAt: new Date(Date.now() + 60000) // 1 minute construction time for testing
      },
      include: {
        building: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      playerBuilding,
      updatedResources 
    });

  } catch (error) {
    console.error('Error building construction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 