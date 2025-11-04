import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  imageBlob?: Blob;
  isLoading?: boolean;
  loadingText?: string;
}

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (message: string, mode: 'chat' | 'webSearch' | 'reasoning' | 'imageGen') => void;
  isLoading: boolean;
}

const ChatArea = ({ messages, onSendMessage, isLoading }: ChatAreaProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col">
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
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Welcome to FARABI.me
                  </h1>
                  <p className="mt-2 text-muted-foreground">
                    Start a conversation with AI
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
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      <ChatInput onSendMessage={onSendMessage} disabled={isLoading} />
    </div>
  );
};

export default ChatArea;
