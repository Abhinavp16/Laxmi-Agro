'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, CheckCheck } from '@/components/hugeicons';
import { useNegotiationSocket } from '@/lib/hooks/useNegotiationSocket';
import { formatDistanceToNow } from 'date-fns';

interface NegotiationChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negotiationId: string;
  wholesalerName: string;
  productName: string;
  adminId: string;
  adminName: string;
}

export function NegotiationChatDialog({
  open,
  onOpenChange,
  negotiationId,
  wholesalerName,
  productName,
  adminId,
  adminName,
}: NegotiationChatDialogProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    messages,
    typingUsers,
    readReceipts,
    sendMessage: sendSocketMessage,
    emitTyping,
    emitStopTyping,
  } = useNegotiationSocket(
    negotiationId,
    adminId,
    adminName,
    'https://api.laxmiagroenterprises.com'
  );

  // Auto-scroll to bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !isConnected) return;

    setIsSending(true);
    setMessage('');
    emitStopTyping();

    try {
      sendSocketMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    if (value.trim()) {
      emitTyping();
    } else {
      emitStopTyping();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-w-2xl h-[600px]">
        <DialogHeader>
          <DialogTitle>Negotiation Chat</DialogTitle>
          <DialogDescription className="space-y-1">
            <p>
              <strong>{wholesalerName}</strong> - {productName}
            </p>
            <div className="flex items-center gap-2 text-xs">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 border rounded-lg p-4 bg-slate-50">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.messageId}
                  className={`flex ${
                    msg.userRole === 'admin' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.userRole === 'admin'
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs mb-1">
                      <span className="font-semibold">
                        {msg.userRole === 'admin' ? 'You' : wholesalerName}
                      </span>
                      <span className="text-gray-500">
                        {formatDistanceToNow(new Date(msg.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                      {msg.userRole === 'admin' && readReceipts.has(msg.messageId) && (
                        <CheckCheck size={14} className="text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm break-words">{msg.message}</p>
                  </div>
                </div>
              ))
            )}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-500 italic">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
                <span>
                  {typingUsers.map((u) => u.username).join(', ')} is typing...
                </span>
              </div>
            )}

            <div ref={messageEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="flex gap-2 mt-4">
          <Input
            placeholder="Type a message... (max 280 chars)"
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={!isConnected || isSending}
            maxLength={280}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!isConnected || isSending || !message.trim()}
            size="icon"
          >
            {isSending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </Button>
        </div>

        {/* Character Count */}
        <div className="text-xs text-gray-500 text-right">
          {message.length}/280
        </div>
      </DialogContent>
    </Dialog>
  );
}
