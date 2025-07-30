'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { io, Socket } from 'socket.io-client';
import logger from '@/lib/logger';

type ChatRoom = 'global' | 'alliance';

interface ChatMessage {
  id: number;
  playerName: string;
  content: string;
  messageType: 'TEXT' | 'SYSTEM' | 'TRADE' | 'ALLIANCE';
  createdAt: string;
}

interface ChatProps {
  className?: string;
}

const Chat: React.FC<ChatProps> = ({ className = '' }) => {
  const { player } = usePlayer();
  const [activeRoom, setActiveRoom] = useState<ChatRoom>('global');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [hasAlliance, setHasAlliance] = useState(false);
  const [allianceName, setAllianceName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Check alliance membership
  useEffect(() => {
    if (!player) return;
    
    const checkAllianceMembership = async () => {
      try {
        const response = await fetch(`/api/player/${player.id}/alliance`);
        if (response.ok) {
          const data = await response.json();
          setHasAlliance(data.hasAlliance);
          setAllianceName(data.allianceName || '');
        } else {
          setHasAlliance(false);
          setAllianceName('');
        }
      } catch (error) {
        logger.error('Chat - failed to check alliance membership', { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        setHasAlliance(false);
        setAllianceName('');
      }
    };
    
    checkAllianceMembership();
  }, [player?.id]);

  // Socket.IO connection
  useEffect(() => {
    if (!player) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling']
    });
    
    logger.debug('Chat - connecting to Socket.IO', { room: activeRoom });
    
    socketInstance.on('connect', () => {
      logger.debug('Chat - Socket.IO connected', { room: activeRoom });
      socketInstance.emit('join-room', activeRoom, player.id.toString());
    });
    
    socketInstance.on('new-message', (message) => {
      logger.debug('Chat - received message', { message });
      setMessages(prev => [...prev, message]);
    });
    
    socketInstance.on('message-history', (messages) => {
      logger.debug('Chat - received message history', { messageCount: messages.length });
      setMessages(messages);
    });
    
    socketInstance.on('message-error', (error) => {
      logger.error('Chat - message error', { 
        error: typeof error === 'string' ? error : 'Unknown error' 
      });
      // Could show a toast notification here
    });
    
    socketInstance.on('disconnect', () => {
      logger.debug('Chat - Socket.IO disconnected', { room: activeRoom });
    });
    
    setSocket(socketInstance);
    
    return () => {
      socketInstance.emit('leave-room', activeRoom);
      socketInstance.disconnect();
    };
  }, [player, activeRoom]);

  // Load initial messages
  useEffect(() => {
    if (!player) return;
    
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/chat/${activeRoom}/messages?playerId=${player.id}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        logger.error('Chat - failed to load messages', { error, room: activeRoom });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMessages();
  }, [player, activeRoom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !player || !socket) return;
    
    const message = newMessage.trim();
    setNewMessage('');
    
    try {
      // Send via Socket.IO for real-time
      socket.emit('send-message', {
        room: activeRoom,
        content: message,
        playerId: player.id.toString(),
        playerName: player.name
      });
      
      // Also send via REST API as backup
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: activeRoom,
          content: message,
          playerId: player.id
        })
      });
    } catch (error) {
      logger.error('Chat - failed to send message', { error, message });
    }
  };

  const handleRoomChange = (room: ChatRoom) => {
    // Don't allow switching to alliance if player has no alliance
    if (room === 'alliance' && !hasAlliance) {
      return;
    }
    setActiveRoom(room);
    setMessages([]); // Clear messages when switching rooms
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!player) {
    return (
      <div className={`bg-earth-gradient border-l border-gold flex flex-col ${className}`}>
        <div className="bg-earth-dark px-4 py-3 border-b border-gold">
          <h3 className="text-lg font-semibold text-gold">Chat</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gold-light">Loading player data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-earth-gradient border-l border-gold flex flex-col ${className}`}>
      {/* Chat Header with Tabs */}
      <div className="bg-earth-dark px-2 sm:px-4 py-2 sm:py-3 border-b border-gold">
        <h3 className="text-base sm:text-lg font-semibold text-gold mb-2">Chat</h3>
        <div className="flex space-x-1">
          <button
            onClick={() => handleRoomChange('global')}
            className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${
              activeRoom === 'global'
                ? 'bg-gold-gradient text-forest-dark font-semibold shadow-lg'
                : 'bg-forest-light text-gold-light hover:bg-forest-lighter border border-forest'
            }`}
          >
            Global
          </button>
          <button
            onClick={() => handleRoomChange('alliance')}
            disabled={!hasAlliance}
            className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${
              activeRoom === 'alliance'
                ? 'bg-gold-gradient text-forest-dark font-semibold shadow-lg'
                : hasAlliance
                ? 'bg-forest-light text-gold-light hover:bg-forest-lighter border border-forest'
                : 'bg-forest-dark text-forest-lighter cursor-not-allowed border border-forest'
            }`}
            title={hasAlliance ? `Alliance: ${allianceName}` : 'Join an alliance to access alliance chat'}
          >
            Alliance
          </button>
        </div>
        {hasAlliance && activeRoom === 'alliance' && (
          <p className="text-xs text-gold-light mt-1">Alliance: {allianceName}</p>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gold"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gold-light text-sm py-8">
                {activeRoom === 'alliance' && !hasAlliance 
                  ? 'Join an alliance to access alliance chat'
                  : 'No messages yet. Start the conversation!'
                }
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-lg p-3 border ${
                    message.messageType === 'SYSTEM'
                      ? 'bg-forest-light border-forest'
                      : 'bg-forest border-forest'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-semibold text-sm ${
                      message.messageType === 'SYSTEM' ? 'text-gold' : 'text-gold-light'
                    }`}>
                      {message.playerName}
                    </span>
                    <span className="text-xs text-gold-light opacity-75">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gold-light break-words">
                    {message.content}
                  </p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="border-t border-gold p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              activeRoom === 'alliance' && !hasAlliance
                ? 'Join an alliance to chat'
                : `Type your message in ${activeRoom} chat...`
            }
            disabled={activeRoom === 'alliance' && !hasAlliance}
            className="flex-1 px-3 py-2 bg-forest-dark border border-forest rounded text-gold-light placeholder-forest-lighter focus:outline-none focus:border-gold disabled:opacity-50 disabled:cursor-not-allowed"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || (activeRoom === 'alliance' && !hasAlliance)}
            className="px-4 py-2 bg-gold-gradient text-forest-dark rounded hover:opacity-90 transition-opacity font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat; 