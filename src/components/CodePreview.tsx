import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface CodePreviewProps {
  code: string;
  language: string;
  isOpen: boolean;
  onClose: () => void;
}

const CodePreview = ({ code, language, isOpen, onClose }: CodePreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  const webLanguages = ['html', 'css', 'javascript', 'js', 'jsx', 'xml'];
  const canPreview = webLanguages.includes(language.toLowerCase());

  useEffect(() => {
    if (!isOpen || !canPreview) return;

    try {
      setError(null);
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow) return;

      const doc = iframe.contentWindow.document;
      doc.open();
      
      if (language.toLowerCase() === 'html' || language.toLowerCase() === 'xml') {
        doc.write(code);
      } else if (language.toLowerCase() === 'css') {
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <style>${code}</style>
            </head>
            <body>
              <h1>CSS Preview</h1>
              <p>This is a paragraph with your custom styles.</p>
              <div>This is a div element.</div>
              <button>Sample Button</button>
            </body>
          </html>
        `);
      } else {
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .error { color: red; padding: 10px; background: #fee; border: 1px solid red; }
              </style>
            </head>
            <body>
              <div id="output"></div>
              <script>
                try {
                  ${code}
                } catch (err) {
                  document.getElementById('output').innerHTML = 
                    '<div class="error"><strong>Error:</strong> ' + err.message + '</div>';
                }
              </script>
            </body>
          </html>
        `);
      }
      
      doc.close();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to render preview');
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

        {canPreview ? (
          <iframe
            ref={iframeRef}
            className="w-full flex-1 border border-border rounded-md bg-background"
            sandbox="allow-scripts allow-same-origin"
            title="Code Preview"
          />
        ) : (
          <div className="flex items-center justify-center flex-1 text-muted-foreground">
            <div className="text-center space-y-2">
              <AlertCircle className="h-12 w-12 mx-auto opacity-50" />
              <p className="text-lg font-medium">Preview not available for {language}</p>
              <p className="text-sm">Use Download to save and run locally.</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CodePreview;
