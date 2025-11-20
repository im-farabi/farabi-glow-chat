import { useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const PremiumBackground = () => {
  const isMobile = useIsMobile();
  
  // Reduce particle count dramatically on mobile for performance (71% reduction)
  const particleMultiplier = isMobile ? 0.3 : 1;
  
  // Generate random particle data on mount (memoized for performance)
  const largeOrbs = useMemo(() => 
    Array.from({ length: Math.floor(6 * particleMultiplier) }, (_, i) => ({
      id: i,
      size: Math.random() * 200 + 200, // 200-400px
      left: Math.random() * 100,
      top: Math.random() * 100,
      color: i % 2 === 0 ? 'pink' : 'purple',
      duration: Math.random() * 20 + 20, // 20-40s
      delay: Math.random() * 5,
      blur: Math.random() * 40 + 60, // 60-100px
      opacity: Math.random() * 0.1 + 0.05 // 5-15%
    })), [particleMultiplier]
  );

  const mediumParticles = useMemo(() => 
    Array.from({ length: Math.floor(18 * particleMultiplier) }, (_, i) => ({
      id: i,
      size: Math.random() * 70 + 80, // 80-150px
      left: Math.random() * 100,
      top: Math.random() * 100,
      color: Math.random() > 0.5 ? 'pink' : 'purple',
      duration: Math.random() * 10 + 15, // 15-25s
      delay: Math.random() * 8,
      blur: isMobile ? 20 : 40, // Reduce blur on mobile
      opacity: Math.random() * 0.05 + 0.03 // 3-8%
    })), [particleMultiplier, isMobile]
  );

  const smallParticles = useMemo(() => 
    Array.from({ length: Math.floor(35 * particleMultiplier) }, (_, i) => ({
      id: i,
      size: Math.random() * 40 + 20, // 20-60px
      left: Math.random() * 100,
      top: Math.random() * 100,
      color: Math.random() > 0.5 ? 'pink' : 'purple',
      duration: Math.random() * 10 + 10, // 10-20s
      delay: Math.random() * 10,
      blur: isMobile ? 10 : 20, // Reduce blur on mobile
      opacity: Math.random() * 0.03 + 0.02 // 2-5%
    })), [particleMultiplier, isMobile]
  );

  const getAnimationClass = (index: number) => {
    const animations = ['animate-float-1', 'animate-float-2', 'animate-float-3'];
    return animations[index % 3];
  };

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Pure black base */}
      <div className="absolute inset-0 bg-black" />
      
      {/* Large orbs layer */}
      <div className="absolute inset-0">
        {largeOrbs.map(orb => (
          <div
            key={`orb-${orb.id}`}
            className={`absolute rounded-full ${getAnimationClass(orb.id)}`}
            style={{
              width: `${orb.size}px`,
              height: `${orb.size}px`,
              left: `${orb.left}%`,
              top: `${orb.top}%`,
              background: orb.color === 'pink' 
                ? 'radial-gradient(circle, hsl(330 81% 60%) 0%, transparent 70%)'
                : 'radial-gradient(circle, hsl(271 81% 60%) 0%, transparent 70%)',
              opacity: orb.opacity,
              filter: `blur(${orb.blur}px)`,
              animationDelay: `${orb.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Medium particles layer */}
      <div className="absolute inset-0">
        {mediumParticles.map(particle => (
          <div
            key={`medium-${particle.id}`}
            className={`absolute rounded-full ${getAnimationClass(particle.id)}`}
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              background: particle.color === 'pink' 
                ? 'radial-gradient(circle, hsl(330 81% 60%) 0%, transparent 70%)'
                : 'radial-gradient(circle, hsl(271 81% 60%) 0%, transparent 70%)',
              opacity: particle.opacity,
              filter: `blur(${particle.blur}px)`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Small particles layer */}
      <div className="absolute inset-0">
        {smallParticles.map(particle => (
          <div
            key={`small-${particle.id}`}
            className={`absolute rounded-full animate-pulse-particle ${getAnimationClass(particle.id)}`}
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              background: particle.color === 'pink' 
                ? 'radial-gradient(circle, hsl(330 81% 60%) 0%, transparent 70%)'
                : 'radial-gradient(circle, hsl(271 81% 60%) 0%, transparent 70%)',
              opacity: particle.opacity,
              filter: `blur(${particle.blur}px)`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Mesh gradient overlay */}
      <div className="absolute inset-0">
        <div 
          className="absolute w-[800px] h-[800px] rounded-full opacity-10 blur-[100px] animate-gradient-mesh"
          style={{
            left: '20%',
            top: '10%',
            background: 'radial-gradient(circle, hsl(330 81% 60% / 0.3) 0%, transparent 70%)'
          }}
        />
        <div 
          className="absolute w-[600px] h-[600px] rounded-full opacity-10 blur-[100px] animate-gradient-mesh"
          style={{
            right: '15%',
            bottom: '15%',
            background: 'radial-gradient(circle, hsl(271 81% 60% / 0.3) 0%, transparent 70%)',
            animationDelay: '5s'
          }}
        />
      </div>

      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          backgroundRepeat: 'repeat'
        }}
      />
    </div>
  );
};

export default PremiumBackground;
