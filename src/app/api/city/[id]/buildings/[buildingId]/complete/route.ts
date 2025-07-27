import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import logger from '@/lib/logger';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; buildingId: string }> }
) {
  logger.apiRequest('POST', `/api/city/[id]/buildings/[buildingId]/complete`, { params: await params });
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, buildingId } = await params;
    const cityId = parseInt(id);
    const playerBuildingId = parseInt(buildingId);
    
    if (isNaN(cityId) || isNaN(playerBuildingId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
    }

    // Get the player building
    const playerBuilding = await prisma.playerBuilding.findUnique({
      where: { id: playerBuildingId },
      include: { 
        city: { 
          include: { 
            player: true 
          } 
        }, 
        building: true 
      }
    });

    if (!playerBuilding) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 });
    }

    // Check if user owns this city
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || playerBuilding.city.player.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if construction time has passed
    const now = new Date();
    const constructionEndsAt = new Date(playerBuilding.constructionEndsAt!);
    
    if (now < constructionEndsAt) {
      return NextResponse.json({ error: 'Construction not yet complete' }, { status: 400 });
    }

    // Mark construction as complete
    const updatedBuilding = await prisma.playerBuilding.update({
      where: { id: playerBuildingId },
      data: {
        isConstructing: false,
        constructionStartedAt: null,
        constructionEndsAt: null
      },
      include: {
        building: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      playerBuilding: updatedBuilding 
    });

  } catch (error) {
    console.error('Error completing construction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 