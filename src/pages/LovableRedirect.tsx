import { useEffect } from 'react';

const LovableRedirect = () => {
  useEffect(() => {
    window.location.href = 'https://lovable.dev/invite/5OJSFEM';
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirecting to Lovable...</p>
    </div>
  );
};

export default LovableRedirect;
