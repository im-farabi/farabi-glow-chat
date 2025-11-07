import { User, MoreVertical, Copy, Volume2, ChevronDown, ChevronUp } from 'lucide-react';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import CodeBlock from './CodeBlock';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
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
}

// Add glow effect to ! and ? symbols
function addGlowToExclamations(text: string): React.ReactNode[] {
  const parts = text.split(/([!?])/g);
  return parts.map((part, i) => {
    if (part === '!' || part === '?') {
      return (
        <span 
          key={i} 
          className="font-bold" 
          style={{ 
            textShadow: '0 0 8px rgba(255, 255, 255, 0.6), 0 0 12px rgba(255, 255, 255, 0.4)' 
          }}
        >
          {part}
        </span>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

const ChatMessage = ({ role, content, image, imageBlob, isLoading, loadingText, responseTime, onRead, onExplain }: ChatMessageProps) => {
  const isUser = role === 'user';
  const { toast } = useToast();
  const [explainClicked, setExplainClicked] = useState(false);

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
    toast({
      title: "Copied!",
      description: "Response copied to clipboard",
    });
  };

  const handleRead = () => {
    onRead?.(content, false);
  };

  return (
    <div className={`flex gap-4 px-6 lg:px-12 xl:px-24 py-6 ${isUser ? 'bg-card' : 'bg-muted/30'} ${!isUser && !isLoading ? 'animate-text-reveal' : 'animate-fade-in'}`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
        isUser 
          ? 'bg-muted' 
          : 'bg-accent'
      }`}>
        {isUser ? (
          <User className="h-5 w-5 text-white" />
        ) : (
              <img 
                src="/bot-logo.ico" 
                alt="FARABI" 
                className="h-5 w-5 object-contain brightness-0 invert"
              />
        )}
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {isUser ? 'You' : 'FARABI'}
            </span>
            {!isUser && responseTime && (
              <span className="text-xs text-muted-foreground">
                {responseTime.toFixed(2)}s
              </span>
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
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRead}>
                  <Volume2 className="mr-2 h-4 w-4" />
                  Read
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onRead?.(content, true)}
                  className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 hover:from-pink-500/20 hover:to-purple-500/20"
                  style={{
                    textShadow: '0 0 10px rgba(236, 72, 153, 0.3)',
                  }}
                >
                  <Volume2 className="mr-2 h-4 w-4 text-pink-500" />
                  <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent font-semibold">
                    Advanced Reader
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {image && (
          <img 
            src={image} 
            alt="Uploaded" 
            className="max-w-md rounded-lg border border-border"
          />
        )}

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-primary animate-typing" style={{ animationDelay: '0s' }} />
              <span className="h-2 w-2 rounded-full bg-primary animate-typing" style={{ animationDelay: '0.2s' }} />
              <span className="h-2 w-2 rounded-full bg-primary animate-typing" style={{ animationDelay: '0.4s' }} />
            </div>
            <span className="text-sm">{loadingText || 'Thinking...'}</span>
          </div>
        ) : (
          <div className="max-w-none overflow-x-auto">
            {isDownloadMessage ? (
              <p className="whitespace-pre-wrap text-foreground">
                {content.split('Click here to download')[0]}
                <button
                  onClick={handleDownload}
                  className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors font-medium"
                >
                  Click here to download
                </button>
              </p>
            ) : (
              <div className="prose prose-invert max-w-none overflow-x-auto">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code(props) {
                      const { children, className, node, ...rest } = props;
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !className;
                      return !isInline ? (
                        <CodeBlock language={match ? match[1] : 'text'}>
                          {String(children).replace(/\n$/, '')}
                        </CodeBlock>
                      ) : (
                        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground break-words" {...rest}>
                          {children}
                        </code>
                      );
                    },
                    a(props) {
                      const { children, href, node, ...rest } = props;
                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors font-medium"
                          {...rest}
                        >
                          {children}
                        </a>
                      );
                    },
                    strong(props) {
                      const { children, ...rest } = props;
                      const processedChildren = React.Children.map(children, (child) => {
                        if (typeof child === 'string') {
                          return addGlowToExclamations(child);
                        }
                        return child;
                      });
                      return <strong className="font-bold text-foreground" {...rest}>{processedChildren}</strong>;
                    },
                    p(props) {
                      const { children, ...rest } = props;
                      const processedChildren = React.Children.map(children, (child) => {
                        if (typeof child === 'string') {
                          return addGlowToExclamations(child);
                        }
                        return child;
                      });
                      return <p className="whitespace-pre-wrap text-foreground mb-4 last:mb-0" {...rest}>{processedChildren}</p>;
                    },
                    h1(props) {
                      const { children, ...rest } = props;
                      const processedChildren = React.Children.map(children, (child) => {
                        if (typeof child === 'string') {
                          return addGlowToExclamations(child);
                        }
                        return child;
                      });
                      return <h1 className="text-3xl font-bold text-foreground mb-4 mt-6 first:mt-0" {...rest}>{processedChildren}</h1>;
                    },
                    h2(props) {
                      const { children, ...rest } = props;
                      const processedChildren = React.Children.map(children, (child) => {
                        if (typeof child === 'string') {
                          return addGlowToExclamations(child);
                        }
                        return child;
                      });
                      return <h2 className="text-2xl font-bold text-foreground mb-3 mt-5 first:mt-0" {...rest}>{processedChildren}</h2>;
                    },
                    h3(props) {
                      const { children, ...rest } = props;
                      const processedChildren = React.Children.map(children, (child) => {
                        if (typeof child === 'string') {
                          return addGlowToExclamations(child);
                        }
                        return child;
                      });
                      return <h3 className="text-xl font-bold text-foreground mb-3 mt-4 first:mt-0" {...rest}>{processedChildren}</h3>;
                    },
                    h4(props) {
                      const { children, ...rest } = props;
                      const processedChildren = React.Children.map(children, (child) => {
                        if (typeof child === 'string') {
                          return addGlowToExclamations(child);
                        }
                        return child;
                      });
                      return <h4 className="text-lg font-bold text-foreground mb-2 mt-3 first:mt-0" {...rest}>{processedChildren}</h4>;
                    },
                    h5(props) {
                      const { children, ...rest } = props;
                      const processedChildren = React.Children.map(children, (child) => {
                        if (typeof child === 'string') {
                          return addGlowToExclamations(child);
                        }
                        return child;
                      });
                      return <h5 className="text-base font-bold text-foreground mb-2 mt-3 first:mt-0" {...rest}>{processedChildren}</h5>;
                    },
                    h6(props) {
                      const { children, ...rest } = props;
                      const processedChildren = React.Children.map(children, (child) => {
                        if (typeof child === 'string') {
                          return addGlowToExclamations(child);
                        }
                        return child;
                      });
                      return <h6 className="text-sm font-bold text-foreground mb-2 mt-2 first:mt-0" {...rest}>{processedChildren}</h6>;
                    },
                  } as Components}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {role === 'assistant' && onExplain && !isLoading && !explainClicked && (
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setExplainClicked(true);
                onExplain('shorter');
              }}
              className="text-xs"
            >
              <ChevronDown className="h-3 w-3 mr-1" />
              Explain in shorter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setExplainClicked(true);
                onExplain('easy');
              }}
              className="text-xs"
            >
              Explain in easy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setExplainClicked(true);
                onExplain('longer');
              }}
              className="text-xs"
            >
              <ChevronUp className="h-3 w-3 mr-1" />
              Explain more longer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
