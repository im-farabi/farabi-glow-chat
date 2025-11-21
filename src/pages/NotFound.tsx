import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

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
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:opacity-80">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
