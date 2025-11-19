import { User, MoreVertical, Copy, Volume2, ChevronDown, ChevronUp, ListChecks, SquareStack, Download } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import CodeBlock from './CodeBlock';
import FlashcardItem from './FlashcardItem';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  imageBlob?: Blob;
  isLoading?: boolean;
  loadingText?: string;
  responseTime?: number;
  onRead?: (text: string, advanced?: boolean) => void;
  onExplain?: (type: 'shorter' | 'easy' | 'longer') => void;
  mcqData?: { question: string; options: string[]; correctAnswer: number }[];
  flashcardData?: { question: string; answer: string }[];
  audioUrl?: string;
  audioBlob?: Blob;
}

function addGlowToExclamations(text: string): React.ReactNode[] {
  const parts = text.split(/([!?])/g);
  return parts.map((part, i) => {
    if (part === '!' || part === '?') {
      return (
        <span 
          key={i} 
          className="font-bold" 
          style={{ textShadow: '0 0 8px rgba(255, 255, 255, 0.6), 0 0 12px rgba(255, 255, 255, 0.4)' }}
        >
          {part}
        </span>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

const ChatMessage = React.memo(({ role, content, image, imageBlob, isLoading, loadingText, responseTime, onRead, onExplain, mcqData, flashcardData, audioUrl, audioBlob }: ChatMessageProps) => {
  const isUser = role === 'user';
  const { toast } = useToast();
  const [explainClicked, setExplainClicked] = useState(false);
  const [thinkingTime, setThinkingTime] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setThinkingTime(0);
      const interval = setInterval(() => {
        setThinkingTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleDownload = () => {
    if (imageBlob && image) {
      const a = document.createElement('a');
      a.href = image;
      a.download = `farabi-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const isDownloadMessage = content.includes('Click here to download');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    toast({ title: "Copied!", description: "Response copied to clipboard" });
  };

  const handleRead = () => {
    onRead?.(content, false);
  };

  return (
    <div className={`py-3 md:py-4 ${!isUser && !isLoading ? 'animate-fade-in' : ''}`}>
      <div className="max-w-[900px] mx-auto px-4 md:px-6">
        <div className={`flex gap-4 message-card`}>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isUser ? 'bg-muted border border-border' : 'bg-gradient-to-br from-primary to-secondary shadow-[0_0_20px_rgba(6,182,212,0.3)]'}`}>
            {isUser ? (
              <User className="h-5 w-5 text-foreground" />
            ) : (
              <img src="/bot-logo.ico" alt="FARABI" className="h-5 w-5 object-contain brightness-0 invert" />
            )}
          </div>

          <div className="flex-1 space-y-3 max-w-full overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {isUser ? (
                  <div className="px-3 py-1 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
                    <span className="font-semibold text-sm">You</span>
                  </div>
                ) : (
                  <span className="font-semibold">FARABI</span>
                )}
                {!isUser && responseTime && (
                  <span className="text-xs text-muted-foreground">{responseTime.toFixed(2)}s</span>
                )}
              </div>
          
              {!isUser && !isLoading && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleCopy}>
                      <Copy className="mr-2 h-4 w-4" />Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleRead}>
                      <Volume2 className="mr-2 h-4 w-4" />Read
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onRead?.(content, true)}
                      className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 hover:from-pink-500/20 hover:to-purple-500/20"
                      style={{ textShadow: '0 0 10px rgba(236, 72, 153, 0.3)' }}
                    >
                      <Volume2 className="mr-2 h-4 w-4 text-pink-500" />
                      <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent font-semibold">Advanced Reader</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {image && <img src={image} alt="Uploaded" className="max-w-md rounded-lg border border-border" />}

            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary animate-typing" style={{ animationDelay: '0s' }} />
                  <span className="h-2 w-2 rounded-full bg-primary animate-typing" style={{ animationDelay: '0.2s' }} />
                  <span className="h-2 w-2 rounded-full bg-primary animate-typing" style={{ animationDelay: '0.4s' }} />
                </div>
                <span className="text-sm">{thinkingTime < 2 ? 'Sending...' : `Thought for ${thinkingTime} second${thinkingTime !== 1 ? 's' : ''}...`}</span>
              </div>
            ) : (
              <div className="max-w-full overflow-x-auto break-words">
                {isDownloadMessage ? (
                  <p className="whitespace-pre-wrap text-foreground text-lg">
                    {content.split('Click here to download')[0]}
                    <button onClick={handleDownload} className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors font-medium">
                      Click here to download
                    </button>
                    {content.split('Click here to download')[1]}
                  </p>
                ) : (
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code: ({ node, inline, className, children, ...props }: any) => {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <CodeBlock language={match[1]}>{String(children).replace(/\n$/, '')}</CodeBlock>
                          ) : (
                            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
                          );
                        },
                      p: ({ children }) => {
                        const text = String(children);
                        if (text.match(/[!?]/)) {
                          return <p className="mb-4 leading-7">{addGlowToExclamations(text)}</p>;
                        }
                        return <p className="mb-4 leading-7">{children}</p>;
                      },
                      ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
                      h1: ({ children }) => <h1 className="text-3xl font-bold mb-4 mt-6">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-2xl font-bold mb-3 mt-5">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xl font-bold mb-2 mt-4">{children}</h3>,
                      } as Components}
                    >
                      {content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            )}

            {mcqData && mcqData.length > 0 && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ListChecks className="h-4 w-4" />Generated MCQs ({mcqData.length} questions)
                </div>
                {mcqData.map((mcq, idx) => (
                  <Card key={idx} className="p-4 bg-card border-border">
                    <div className="space-y-3">
                      <p className="font-medium">{idx + 1}. {mcq.question}</p>
                      <div className="space-y-2">
                        {mcq.options.map((option, optIdx) => (
                          <div key={optIdx} className={`p-2 rounded-md border ${optIdx === mcq.correctAnswer ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-border bg-muted/30'}`}>
                            {String.fromCharCode(65 + optIdx)}. {option}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {flashcardData && flashcardData.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 text-sm font-medium mb-3">
                  <SquareStack className="h-4 w-4" />Generated Flashcards ({flashcardData.length} cards)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {flashcardData.map((card, idx) => (
                    <FlashcardItem key={idx} card={{ question: card.question, answer: card.answer }} index={idx} flipMode="click" />
                  ))}
                </div>
              </div>
            )}

            {audioUrl && (
              <div className="mt-4">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Volume2 className="h-4 w-4" />Generated Voice Explanation
                </div>
                <audio controls src={audioUrl} className="w-full max-w-md" />
                {audioBlob && (
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                    const a = document.createElement('a');
                    a.href = audioUrl;
                    a.download = `farabi.me-voice${Math.floor(Math.random() * 10000)}.mp3`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}>
                    <Download className="h-4 w-4 mr-2" />Download Audio
                  </Button>
                )}
              </div>
            )}

            {role === 'assistant' && onExplain && !isLoading && !explainClicked && (
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => { setExplainClicked(true); onExplain('shorter'); }} className="text-xs">
                  <ChevronDown className="h-3 w-3 mr-1" />Explain in shorter
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setExplainClicked(true); onExplain('easy'); }} className="text-xs">
                  Explain in easy
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setExplainClicked(true); onExplain('longer'); }} className="text-xs">
                  <ChevronUp className="h-3 w-3 mr-1" />Explain more longer
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.content === nextProps.content &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.image === nextProps.image &&
    prevProps.responseTime === nextProps.responseTime &&
    prevProps.mcqData === nextProps.mcqData &&
    prevProps.flashcardData === nextProps.flashcardData &&
    prevProps.audioUrl === nextProps.audioUrl
  );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
