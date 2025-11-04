import { User, Sparkles } from 'lucide-react';

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
          <div className="prose prose-invert max-w-none">
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
              <p className="whitespace-pre-wrap text-foreground">{content}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
