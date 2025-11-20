import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft, Sparkles } from "lucide-react";
import PremiumBackground from "@/components/PremiumBackground";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkIfWebsite = async () => {
      const pathname = location.pathname;
      const maybeSlug = pathname.slice(1);
      
      if (pathname.startsWith('/web/') || !maybeSlug) {
        setChecking(false);
        return;
      }

      try {
        const response = await fetch(
          `https://gjlxuvcfoqjhwzcmpaju.supabase.co/rest/v1/user_websites?slug=eq.${maybeSlug}&is_published=eq.true&select=slug`,
          {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqbHh1dmNmb3FqaHd6Y21wYWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTI5NjEsImV4cCI6MjA3ODM2ODk2MX0.5QgFtSCjSbwzudA8iz2-laO1st46ekY_tJIE2a41Vms',
              'Content-Type': 'application/json',
            }
          }
        );
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          navigate(`/web/${maybeSlug}`, { replace: true });
          return;
        }
      } catch (error) {
        console.error("Error checking website:", error);
      }
      
      setChecking(false);
    };

    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    checkIfWebsite();
  }, [location.pathname, navigate]);

  const popularPages = [
    { name: "AI Chat", path: "/", icon: Sparkles },
    { name: "Image Generator", path: "/image-gen", icon: Sparkles },
    { name: "MCQ Generator", path: "/mcq-gen", icon: Sparkles },
    { name: "Flashcard Generator", path: "/flashcard-gen", icon: Sparkles },
    { name: "Notes Share", path: "/notes-share", icon: Sparkles },
    { name: "AI Maker", path: "/ai-maker", icon: Sparkles },
  ];

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <PremiumBackground />
      
      <div className="max-w-2xl w-full space-y-8 relative z-10">
        {/* 404 Hero */}
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-in zoom-in duration-1000">
            404
          </h1>
          <h2 className="text-3xl font-bold text-foreground">
            Page Not Found
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <Button
            onClick={() => navigate("/")}
            size="lg"
            className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/20"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Button>
          <Button
            onClick={() => navigate(-1)}
            size="lg"
            variant="outline"
            className="gap-2 border-border/50 hover:bg-card/50 backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </Button>
        </div>

        {/* Popular Pages */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="flex items-center gap-2 justify-center text-muted-foreground">
            <Search className="w-4 h-4" />
            <span className="text-sm font-medium">Popular Pages</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {popularPages.map((page, index) => (
              <button
                key={page.path}
                onClick={() => navigate(page.path)}
                className="group p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
                style={{
                  animationDelay: `${400 + index * 50}ms`,
                  animationFillMode: "backwards"
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:from-primary/30 group-hover:to-secondary/30 transition-colors">
                    <page.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {page.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground animate-in fade-in duration-700 delay-500">
          <p>
            If you believe this is an error, please{" "}
            <button
              onClick={() => navigate("/support")}
              className="text-primary hover:underline font-medium"
            >
              contact support
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
