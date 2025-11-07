import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import AdBanner from './AdBanner';
import { useMediaQuery } from '@/hooks/use-mobile';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  imageBlob?: Blob;
  isLoading?: boolean;
  loadingText?: string;
  responseTime?: number;
}

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (message: string, mode: 'chat' | 'fast' | 'normal' | 'super' | 'imageGen') => void;
  isLoading: boolean;
  onRead?: (text: string, advanced?: boolean) => void;
  showAdBanner?: boolean;
  onCloseAdBanner?: () => void;
}

const ChatArea = ({ messages, onSendMessage, isLoading, onRead, showAdBanner, onCloseAdBanner }: ChatAreaProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 1024px)');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {isMobile ? (
        <div ref={scrollAreaRef} className="flex-1 mobile-scroll">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center p-8">
              <div className="text-center space-y-4">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary p-2">
                  <img 
                    src="/favicon.ico" 
                    alt="FARABI.me" 
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-lg text-muted-foreground">
                    Start a conversation with FARABI
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                  image={message.image}
                  imageBlob={message.imageBlob}
                  isLoading={message.isLoading}
                  loadingText={message.loadingText}
                  responseTime={message.responseTime}
                  onRead={onRead}
                />
              ))}
              {showAdBanner && onCloseAdBanner && (
                <AdBanner onClose={onCloseAdBanner} />
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div ref={scrollAreaRef} className="min-h-full">
            {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center p-8">
              <div className="text-center space-y-4">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary p-2">
                  <img 
                    src="/favicon.ico" 
                    alt="FARABI.me" 
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-lg text-muted-foreground">
                    Start a conversation with FARABI
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                  image={message.image}
                  imageBlob={message.imageBlob}
                  isLoading={message.isLoading}
                  loadingText={message.loadingText}
                  responseTime={message.responseTime}
                  onRead={onRead}
                />
              ))}
              {showAdBanner && onCloseAdBanner && (
                <AdBanner onClose={onCloseAdBanner} />
              )}
              <div ref={messagesEndRef} />
            </>
            )}
          </div>
        </ScrollArea>
      )}

      <ChatInput onSendMessage={onSendMessage} disabled={isLoading} />
    </div>
  );
};

export default ChatArea;
