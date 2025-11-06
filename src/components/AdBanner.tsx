import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import horizonBanner from '@/assets/horizonad.png';
import lovableBanner from '@/assets/lovablead.png';

interface AdBannerProps {
  onClose: () => void;
}

const AdBanner = ({ onClose }: AdBannerProps) => {
  const [timeLeft, setTimeLeft] = useState(7);
  const [isVisible, setIsVisible] = useState(true);
  
  // Randomly select banner
  const banners = [
    { image: horizonBanner, link: '/horizon', alt: 'Horizon by Hostinger' },
    { image: lovableBanner, link: '/lovable', alt: 'Lovable' }
  ];
  const [selectedBanner] = useState(() => banners[Math.floor(Math.random() * banners.length)]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`relative w-full max-w-3xl mx-auto mt-4 mb-2 transition-all duration-300 ${isVisible ? 'animate-fade-in' : 'animate-fade-out'}`}>
      <Link to={selectedBanner.link} className="block relative group">
        <img 
          src={selectedBanner.image} 
          alt={selectedBanner.alt}
          className="w-full h-auto rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 rounded-lg" />
      </Link>
      
      <button
        onClick={handleClose}
        className="absolute -top-2 -right-2 bg-background border border-border rounded-full p-1 shadow-md hover:bg-accent transition-colors duration-200"
        aria-label="Close banner"
      >
        <X className="w-4 h-4" />
      </button>
      
      {timeLeft > 0 && (
        <div className="absolute -top-2 -left-2 bg-primary text-primary-foreground text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
          {timeLeft}
        </div>
      )}
    </div>
  );
};

export default AdBanner;
