import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type ErrorType = "missing-slug" | "not-found" | "server-error" | null;

export default function PublishedWebsite() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState("");
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const { toast } = useToast();

  const fetchWebsite = async () => {
    if (!slug) {
      setErrorType("missing-slug");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorType(null);

    try {
      const { data, error } = await supabase.functions.invoke('serve-website', {
        body: { slug }
      });

      if (error) {
        console.error("Error loading website:", error);
        if (error.message?.includes('404')) {
          setErrorType("not-found");
        } else {
          setErrorType("server-error");
        }
        return;
      }

      if (data) {
        setHtmlContent(data);
      } else {
        setErrorType("not-found");
      }
    } catch (err: any) {
      console.error("Error loading website:", err);
      if (err.message?.includes('404') || err.status === 404) {
        setErrorType("not-found");
      } else {
        setErrorType("server-error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  if (errorType) {
    const errorMessages = {
      "missing-slug": {
        title: "Missing Website Address",
        description: "This page is missing a website address. Please check the URL.",
      },
      "not-found": {
        title: "Website Not Found",
        description: "This website doesn't exist or isn't published yet.",
      },
      "server-error": {
        title: "Server Error",
        description: "Something went wrong loading this website. Please try again.",
      },
    };

    const { title, description } = errorMessages[errorType];

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            {errorType === "missing-slug" || errorType === "not-found" ? "404" : "500"}
          </h1>
          <h2 className="text-2xl font-semibold mb-2 text-foreground">{title}</h2>
          <p className="text-muted-foreground mb-6">{description}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={fetchWebsite} variant="outline">
              Retry
            </Button>
            <Button asChild>
              <a href="/">Go to Home</a>
            </Button>
          </div>
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
