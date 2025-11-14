import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function PublishedWebsite() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWebsite = async () => {
      if (!slug) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('serve-website', {
          body: { slug }
        });

        if (error) throw error;

        if (data) {
          // The serve-website function returns the full HTML as text
          // We need to handle it as a string response
          setHtmlContent(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error loading website:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWebsite();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading website...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-8">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-2">Website Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The website you're looking for doesn't exist or has been removed.
          </p>
          <a href="/" className="text-primary hover:underline">
            Go back to home
          </a>
        </div>
      </div>
    );
  }

  // Render the HTML content in an iframe for better isolation
  return (
    <iframe
      srcDoc={htmlContent}
      title={`Website: ${slug}`}
      className="w-full h-screen border-0"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
}
