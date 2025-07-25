import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cityId = parseInt(id);
    
    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    const updates = await request.json();

    // Verify the city belongs to the authenticated user
    const city = await prisma.city.findFirst({
      where: {
        id: cityId,
        player: {
          userId: session.user.id
        }
      }
    });

    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    // Update the city resources
    const currentResources = city.resources as Record<string, number>;
    const updatedCity = await prisma.city.update({
      where: {
        id: cityId
      },
      data: {
        resources: {
          ...currentResources,
          ...updates
        }
      }
    });

    return NextResponse.json(updatedCity);
  } catch (error) {
    console.error('Error updating city resources:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 