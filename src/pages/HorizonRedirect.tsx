import { useEffect } from 'react';

const HorizonRedirect = () => {
  useEffect(() => {
    window.location.href = 'https://www.hostinger.com/cart?product=horizons%3Astarterv2&period=12&referral_type=cart_link&REFERRALCODE=C1VFARABIAND&referral_id=019a58e3-00ea-7131-8109-6a8deea384be';
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirecting to Horizon...</p>
    </div>
  );
};

export default HorizonRedirect;
