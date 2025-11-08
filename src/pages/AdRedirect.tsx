import { useEffect } from 'react';

const AdRedirect = () => {
  useEffect(() => {
    // Randomly select one of the two URLs
    const adUrls = [
      'https://otieu.com/4/9133136',
      'https://otieu.com/4/9133133'
    ];
    const randomUrl = adUrls[Math.floor(Math.random() * adUrls.length)];
    
    // Redirect to the ad URL
    window.location.href = randomUrl;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to ad...</p>
      </div>
    </div>
  );
};

export default AdRedirect;
