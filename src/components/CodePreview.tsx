import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ExternalLink } from 'lucide-react';

interface CodePreviewProps {
  code: string;
  language: string;
  isOpen: boolean;
  onClose: () => void;
}

const CodePreview = ({ code, language, isOpen, onClose }: CodePreviewProps) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const webLanguages = ['html', 'css', 'javascript', 'js', 'jsx', 'xml'];
  const canPreview = webLanguages.includes(language.toLowerCase());

  useEffect(() => {
    if (!isOpen || !canPreview) {
      setBlobUrl(null);
      return;
    }

    try {
      setError(null);
      let htmlContent = '';
      
      if (language.toLowerCase() === 'html' || language.toLowerCase() === 'xml') {
        htmlContent = code;
      } else if (language.toLowerCase() === 'css') {
        htmlContent = `<!DOCTYPE html><html><head><style>${code}</style></head><body><h1>CSS Preview</h1><p>This is a paragraph with your custom styles.</p><div>This is a div element.</div><button>Sample Button</button></body></html>`;
      } else {
        htmlContent = `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;padding:20px}.error{color:red;padding:10px;background:#fee;border:1px solid red}</style></head><body><div id="output"></div><script>try{${code}}catch(err){document.getElementById('output').innerHTML='<div class="error"><strong>Error:</strong> '+err.message+'</div>';}</script></body></html>`;
      }
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      
      return () => {
        if (url) URL.revokeObjectURL(url);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create preview');
      setBlobUrl(null);
    }
  }, [code, language, isOpen, canPreview]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Code Preview - {language}</DialogTitle>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {canPreview && blobUrl ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-6 p-8">
            <div className="text-center space-y-4">
              <div className="text-6xl">✅</div>
              <p className="text-xl font-semibold">Preview Ready</p>
              <a
                href={blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium shadow-lg"
              >
                Click here to see live preview
                <ExternalLink className="h-4 w-4" />
              </a>
              <p className="text-sm text-muted-foreground mt-2">Opens in a new tab</p>
            </div>
          </div>
        ) : !canPreview ? (
          <div className="flex items-center justify-center flex-1 text-muted-foreground">
            <div className="text-center space-y-2">
              <AlertCircle className="h-12 w-12 mx-auto opacity-50" />
              <p className="text-lg font-medium">Preview not available for {language}</p>
              <p className="text-sm">Use Download to save and run locally.</p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default CodePreview;
