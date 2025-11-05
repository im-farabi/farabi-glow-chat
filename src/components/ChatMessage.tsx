import { User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import CodeBlock from './CodeBlock';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  imageBlob?: Blob;
  isLoading?: boolean;
  loadingText?: string;
}

// Generate consistent colors for symbols
const symbolColors = new Map<string, string>();
const darkColors = [
  'text-green-600',
  'text-blue-600', 
  'text-purple-600',
  'text-red-600',
  'text-yellow-600',
  'text-cyan-600',
  'text-pink-600',
  'text-indigo-600',
  'text-orange-600',
  'text-teal-600'
];

function getSymbolColor(symbol: string): string {
  if (!symbolColors.has(symbol)) {
    const color = darkColors[Math.floor(Math.random() * darkColors.length)];
    symbolColors.set(symbol, color);
  }
  return symbolColors.get(symbol)!;
}

const ChatMessage = ({ role, content, image, imageBlob, isLoading, loadingText }: ChatMessageProps) => {
  const isUser = role === 'user';

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

  return (
    <div className={`flex gap-4 px-6 py-6 ${isUser ? 'bg-card' : 'bg-muted/30'} animate-fade-in`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
        isUser 
          ? 'bg-gradient-to-br from-primary to-secondary' 
          : 'bg-accent'
      }`}>
        {isUser ? (
          <User className="h-5 w-5 text-primary-foreground" />
        ) : (
          <Sparkles className="h-5 w-5 text-accent-foreground" />
        )}
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {isUser ? 'You' : 'FARABI'}
          </span>
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
                      const { children, node, ...rest } = props;
                      return <strong className="font-bold text-foreground" {...rest}>{children}</strong>;
                    },
                    p(props) {
                      const { children, node, ...rest } = props;
                      return <p className="whitespace-pre-wrap text-foreground mb-4 last:mb-0" {...rest}>{children}</p>;
                    },
                    text(props) {
                      const { children, node, ...rest } = props;
                      const text = String(children);
                      // Match symbols like $, ,, ., !, ?, etc.
                      const parts = text.split(/([^\w\s])/g);
                      return (
                        <>
                          {parts.map((part, i) => {
                            if (part.match(/[^\w\s]/)) {
                              const color = getSymbolColor(part);
                              return <span key={i} className={`${color} font-bold`}>{part}</span>;
                            }
                            return part;
                          })}
                        </>
                      );
                    },
                    h1(props) {
                      const { children, node, ...rest } = props;
                      return <h1 className="text-3xl font-bold text-foreground mb-4 mt-6 first:mt-0" {...rest}>{children}</h1>;
                    },
                    h2(props) {
                      const { children, node, ...rest } = props;
                      return <h2 className="text-2xl font-bold text-foreground mb-3 mt-5 first:mt-0" {...rest}>{children}</h2>;
                    },
                    h3(props) {
                      const { children, node, ...rest } = props;
                      return <h3 className="text-xl font-bold text-foreground mb-3 mt-4 first:mt-0" {...rest}>{children}</h3>;
                    },
                    h4(props) {
                      const { children, node, ...rest } = props;
                      return <h4 className="text-lg font-bold text-foreground mb-2 mt-3 first:mt-0" {...rest}>{children}</h4>;
                    },
                    h5(props) {
                      const { children, node, ...rest } = props;
                      return <h5 className="text-base font-bold text-foreground mb-2 mt-3 first:mt-0" {...rest}>{children}</h5>;
                    },
                    h6(props) {
                      const { children, node, ...rest } = props;
                      return <h6 className="text-sm font-bold text-foreground mb-2 mt-2 first:mt-0" {...rest}>{children}</h6>;
                    },
                  } as Components}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
