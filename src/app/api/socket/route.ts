import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

interface SocketMessage {
  room: string;
  content: string;
  playerId: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SocketMessage = await request.json();
    const { room, content, playerId } = body;

    if (!room || !content || !playerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    logger.info('Socket - processing message', { 
      room, 
      playerId,
      contentLength: content.length,
      userId: session.user.id 
    });

    // Validate room type
    if (!['global', 'alliance'].includes(room)) {
      return NextResponse.json({ error: 'Invalid room type' }, { status: 400 });
    }

    // Get player and verify ownership
    const player = await prisma.player.findFirst({
      where: {
        id: playerId,
        userId: session.user.id
      },
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
      return NextResponse.json({ error: 'Player not found or access denied' }, { status: 404 });
    }

    let chatRoom: { id: number } | null = null;

    if (room === 'global') {
      // Get or create global kingdom chat room
      if (player.kingdomId) {
        chatRoom = await prisma.chatRoom.findFirst({
          where: {
            kingdomId: player.kingdomId,
            type: 'GLOBAL'
          }
        });

        if (!chatRoom) {
          chatRoom = await prisma.chatRoom.create({
            data: {
              name: `global-${player.kingdomId}`,
              type: 'GLOBAL',
              kingdomId: player.kingdomId
            }
          });
        }
      }
    } else if (room === 'alliance') {
      // Get or create alliance chat room
      if (player.allianceMembership?.allianceId) {
        chatRoom = await prisma.chatRoom.findFirst({
          where: {
            allianceId: player.allianceMembership.allianceId,
            type: 'ALLIANCE'
          }
        });

        if (!chatRoom) {
          chatRoom = await prisma.chatRoom.create({
            data: {
              name: `alliance-${player.allianceMembership.allianceId}`,
              type: 'ALLIANCE',
              allianceId: player.allianceMembership.allianceId
            }
          });
        }
      }
    }

    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not available' }, { status: 400 });
    }

    // Save message to database
    const message = await prisma.chatMessage.create({
      data: {
        roomId: chatRoom.id,
        playerId: playerId,
        content: content,
        messageType: 'TEXT'
      },
      include: {
        player: {
          select: {
            name: true
          }
        }
      }
    });

    logger.info('Socket - message saved successfully', { 
      room, 
      messageId: message.id,
      playerId,
      userId: session.user.id 
    });

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        playerName: message.player.name,
        createdAt: message.createdAt.toISOString()
      }
    });

  } catch (error) {
    logger.error('Socket - error processing message', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
} 