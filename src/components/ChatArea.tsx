import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { recommendedQuestions } from '@/data/recommendedQuestions';
import { useMediaQuery } from '@/hooks/use-mobile';

const RecommendedQuestions = ({ onQuestionClick }: { onQuestionClick: (question: string, mode: any) => void }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
    {recommendedQuestions.slice(0, 4).map((question, idx) => (
      <button
        key={idx}
        onClick={() => {
          const event = new CustomEvent('fillChatInput', { detail: question });
          window.dispatchEvent(event);
        }}
        className="p-4 text-left rounded-xl bg-card/50 border border-border/50 hover:border-primary hover:bg-card/80 transition-all text-sm backdrop-blur-sm hover:scale-105 hover:shadow-lg"
      >
        {question}
      </button>
    ))}
  </div>
);

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
  onExplain?: (messageContent: string, type: 'shorter' | 'easy' | 'longer') => void;
}

const ChatArea = ({ messages, onSendMessage, isLoading, onRead, onExplain }: ChatAreaProps) => {
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
    <div className="flex flex-1 flex-col overflow-hidden relative h-full">
      {/* Background effects */}
      <div className="absolute inset-0 mesh-gradient pointer-events-none" />
      
      {isMobile ? (
        <div ref={scrollAreaRef} className="flex-1 mobile-scroll relative pb-32 pt-2 h-0 min-h-0">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center p-8">
              <div className="text-center space-y-8 max-w-3xl mx-auto animate-fade-in">
                <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary p-3 shadow-[0_0_40px_rgba(6,182,212,0.4)]">
                  <img 
                    src="/bot-logo.ico" 
                    alt="FARABI.me" 
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">
                    <span className="text-foreground">Where ideas meet </span>
                    <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">intelligence</span>
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Start a conversation with FARABI
                  </p>
                </div>
                <RecommendedQuestions onQuestionClick={onSendMessage} />
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
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      ) : (
        <ScrollArea className="flex-1 relative">
          <div ref={scrollAreaRef} className="min-h-full pb-32 pt-2">
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
                </div>
                <RecommendedQuestions onQuestionClick={onSendMessage} />
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
              <div ref={messagesEndRef} />
            </>
            )}
          </div>
        </ScrollArea>
      )}

      <ChatInput onSendMessage={onSendMessage} disabled={isLoading} className="mobile-safe-bottom" />
    </div>
  );
};

export default ChatArea;
