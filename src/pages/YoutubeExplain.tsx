import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Youtube, FileText, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function YoutubeExplain() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    title: string;
    transcript: string;
    summary: string;
    fromCache: boolean;
  } | null>(null);

  const handleExplain = async () => {
    if (!url.trim()) {
      toast.error("Please enter a YouTube URL");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('youtube-explain', {
        body: { url }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      toast.success(data.fromCache ? "Loaded from cache" : "Video processed successfully");
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to process video");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Youtube className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold">YouTube Video Explainer</h1>
          <p className="text-muted-foreground">
            Get AI-powered transcripts and summaries of any YouTube video
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enter YouTube URL</CardTitle>
            <CardDescription>
              Paste any YouTube video URL to get its transcript and AI summary
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExplain()}
                disabled={loading}
                className="flex-1"
              />
              <Button onClick={handleExplain} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing
                  </>
                ) : (
                  "Explain"
                )}
              </Button>
            </div>

            {result && (
              <Alert className="border-primary/20 bg-primary/5">
                <AlertDescription>
                  {result.fromCache ? (
                    "📦 Loaded from cache - Data is less than 24 hours old"
                  ) : (
                    "✨ Freshly processed - Data will be cached for 24 hours"
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="w-5 h-5" />
                  {result.title}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{result.summary}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Full Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {result.transcript}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}