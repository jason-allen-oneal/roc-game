import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ room: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { room } = await params;
    logger.info('Chat - fetching messages', { room, userId: session.user.id });

    // Validate room type
    if (!['global', 'alliance'].includes(room)) {
      return NextResponse.json({ error: 'Invalid room type' }, { status: 400 });
    }

    // Get player with kingdom and alliance info
    const player = await prisma.player.findFirst({
      where: { userId: session.user.id },
      include: {
        kingdom: true,
        allianceMembership: {
          include: {
            alliance: true
          }
        }
      }
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    let messages: Array<{
      id: number;
      content: string;
      messageType: string;
      playerId: number;
      createdAt: Date;
      player: {
        name: string;
      };
    }> = [];

    if (room === 'global') {
      // Get global kingdom messages
      if (player.kingdomId) {
        const chatRoom = await prisma.chatRoom.findFirst({
          where: {
            kingdomId: player.kingdomId,
            type: 'GLOBAL'
          }
        });

        if (chatRoom) {
          messages = await prisma.chatMessage.findMany({
            where: {
              roomId: chatRoom.id
            },
            include: {
              player: {
                select: {
                  name: true
                }
              }
            },
            orderBy: {
              createdAt: 'asc'
            },
            take: 50 // Limit to last 50 messages
          });
        }
      }
    } else if (room === 'alliance') {
      // Get alliance messages
      if (player.allianceMembership?.allianceId) {
        const chatRoom = await prisma.chatRoom.findFirst({
          where: {
            allianceId: player.allianceMembership.allianceId,
            type: 'ALLIANCE'
          }
        });

        if (chatRoom) {
          messages = await prisma.chatMessage.findMany({
            where: {
              roomId: chatRoom.id
            },
            include: {
              player: {
                select: {
                  name: true
                }
              }
            },
            orderBy: {
              createdAt: 'asc'
            },
            take: 50 // Limit to last 50 messages
          });
        }
      }
    }

    logger.info('Chat - messages fetched successfully', { 
      room, 
      messageCount: messages.length,
      userId: session.user.id 
    });

    return NextResponse.json({ messages });
  } catch (error) {
    logger.error('Chat - error fetching messages', { 
      room: params, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
} 