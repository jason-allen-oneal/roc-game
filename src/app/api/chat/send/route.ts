import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { room, content, playerId } = await request.json();

    if (!room || !content || !playerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate that the player belongs to the authenticated user
    const player = await prisma.player.findFirst({
      where: {
        id: parseInt(playerId),
        user: {
          email: session.user.email
        }
      }
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Get or create the chat room
    let chatRoom = await prisma.chatRoom.findFirst({
      where: {
        name: room,
        type: room === 'global' ? 'GLOBAL' : 'ALLIANCE'
      }
    });

    if (!chatRoom) {
      chatRoom = await prisma.chatRoom.create({
        data: {
          name: room,
          type: room === 'global' ? 'GLOBAL' : 'ALLIANCE',
          kingdomId: room === 'alliance' ? player.kingdomId : null
        }
      });
    }

    // Create the message
    const message = await prisma.chatMessage.create({
      data: {
        roomId: chatRoom.id,
        playerId: player.id,
        content: content.trim(),
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

    logger.debug('Chat - message sent', { 
      room, 
      playerId: player.id, 
      playerName: player.name,
      messageId: message.id 
    });

    // Return the message with player name for immediate display
    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        playerName: message.player.name,
        content: message.content,
        messageType: message.messageType,
        createdAt: message.createdAt.toISOString()
      }
    });

  } catch (error) {
    logger.error('Chat - failed to send message', { error });
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
} 