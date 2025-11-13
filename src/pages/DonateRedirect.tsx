import { useEffect } from 'react';

const DonateRedirect = () => {
  useEffect(() => {
    window.location.href = 'https://www.beastphilanthropy.org/donate?utm_source=farabi.me&utm_medium=referral&utm_campaign=farabi_support';
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirecting to Beast Philanthropy...</p>
    </div>
  );
};

export default DonateRedirect;
