import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import AdBanner from './AdBanner';
import { useMediaQuery } from '@/hooks/use-mobile';
import { recommendedQuestions } from '@/data/recommendedQuestions';

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
  onExplain?: (messageContent: string, type: 'shorter' | 'easy' | 'longer') => void;
}

const ChatArea = ({ messages, onSendMessage, isLoading, onRead, showAdBanner, onCloseAdBanner, onExplain }: ChatAreaProps) => {
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
              <div className="text-center space-y-6 max-w-2xl mx-auto">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary p-2">
                  <img 
                    src="/bot-logo.ico" 
                    alt="FARABI.me" 
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    <span className="text-white">Welcome to </span>
                    <span className="text-white">FARABI</span>
                    <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">.me</span>
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    Start a conversation with FARABI
                  </p>
                  
                  {/* Recommended Questions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                    {recommendedQuestions.slice(0, 4).map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const event = new CustomEvent('fillChatInput', { detail: question });
                          window.dispatchEvent(event);
                        }}
                        className="p-4 text-left rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-accent transition-all text-sm"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
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
                  onExplain={message.role === 'assistant' && index === messages.length - 1 && !message.isLoading 
                    ? (type) => {
                        // Find the user message that triggered this assistant response
                        const userMessage = messages[index - 1];
                        if (userMessage && userMessage.role === 'user') {
                          onExplain?.(userMessage.content, type);
                        }
                      }
                    : undefined
                  }
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
              <div className="text-center space-y-6 max-w-2xl mx-auto">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary p-2">
                  <img 
                    src="/bot-logo.ico" 
                    alt="FARABI.me" 
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    <span className="text-white">Welcome to </span>
                    <span className="text-white">FARABI</span>
                    <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">.me</span>
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    Start a conversation with FARABI
                  </p>
                  
                  {/* Recommended Questions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                    {recommendedQuestions.slice(0, 4).map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const event = new CustomEvent('fillChatInput', { detail: question });
                          window.dispatchEvent(event);
                        }}
                        className="p-4 text-left rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-accent transition-all text-sm"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
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
                  onExplain={message.role === 'assistant' && index === messages.length - 1 && !message.isLoading 
                    ? (type) => {
                        // Find the user message that triggered this assistant response
                        const userMessage = messages[index - 1];
                        if (userMessage && userMessage.role === 'user') {
                          onExplain?.(userMessage.content, type);
                        }
                      }
                    : undefined
                  }
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
