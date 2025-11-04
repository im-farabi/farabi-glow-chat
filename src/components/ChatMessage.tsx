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
          <div className="max-w-none">
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
              <div className="prose prose-invert max-w-none">
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
                        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground" {...rest}>
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
