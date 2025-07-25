import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const kingdomId = parseInt(resolvedParams.id);
    if (isNaN(kingdomId)) {
      return NextResponse.json({ error: 'Invalid kingdom ID' }, { status: 400 });
    }

    // Get query parameters for viewport
    const searchParams = request.nextUrl.searchParams;
    const centerX = parseInt(searchParams.get('centerX') || '0');
    const centerY = parseInt(searchParams.get('centerY') || '0');
    const viewportSize = parseInt(searchParams.get('viewportSize') || '50');

    // Validate viewport size (prevent abuse)
    const maxViewportSize = 100;
    const actualViewportSize = Math.min(viewportSize, maxViewportSize);

    // Calculate viewport bounds
    const startX = Math.max(0, centerX - Math.floor(actualViewportSize / 2));
    const endX = Math.min(749, centerX + Math.floor(actualViewportSize / 2));
    const startY = Math.max(0, centerY - Math.floor(actualViewportSize / 2));
    const endY = Math.min(749, centerY + Math.floor(actualViewportSize / 2));

    // Check if user has access to this kingdom
    const player = await prisma.player.findFirst({
      where: {
        userId: session.user.id,
        kingdomId: kingdomId
      }
    });

    if (!player) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Load tiles in viewport
    const tiles = await prisma.mapTile.findMany({
      where: {
        kingdomId,
        x: { gte: startX, lte: endX },
        y: { gte: startY, lte: endY }
      },
      include: {
        city: {
          include: {
            player: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { y: 'asc' },
        { x: 'asc' }
      ]
    });

    return NextResponse.json({
      tiles,
      viewport: {
        startX,
        endX,
        startY,
        endY,
        centerX,
        centerY,
        size: actualViewportSize
      },
      totalTiles: tiles.length
    });

  } catch (error) {
    console.error('Error fetching tiles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 