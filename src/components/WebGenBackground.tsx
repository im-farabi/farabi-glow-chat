const WebGenBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Pure black base */}
      <div className="absolute inset-0 bg-black" />
      
      {/* BRIGHT Central vertical light beam (Huly-inspired) - HIGHLY VISIBLE */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-full">
        <div 
          className="absolute inset-0 animate-pulse-slow"
          style={{
            background: 'linear-gradient(180deg, hsl(330 81% 60% / 0.6) 0%, hsl(271 81% 60% / 0.35) 25%, transparent 55%)',
            maskImage: 'radial-gradient(ellipse 100% 100% at 50% 0%, black 0%, transparent 50%)',
            WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 50% 0%, black 0%, transparent 50%)'
          }}
        />
        {/* Inner bright core */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, hsl(330 81% 65% / 0.7) 0%, hsl(330 81% 60% / 0.3) 20%, transparent 45%)',
            maskImage: 'radial-gradient(ellipse 50% 70% at 50% 0%, black 0%, transparent 60%)',
            WebkitMaskImage: 'radial-gradient(ellipse 50% 70% at 50% 0%, black 0%, transparent 60%)'
          }}
        />
      </div>

      {/* Large VISIBLE pink orb - left side (brain.fm-inspired) */}
      <div 
        className="absolute -left-[200px] top-[5%] w-[800px] h-[800px] animate-float-1"
        style={{
          background: 'radial-gradient(circle, hsl(330 81% 60% / 0.45) 0%, hsl(330 81% 60% / 0.2) 35%, transparent 65%)',
          filter: 'blur(45px)'
        }}
      />

      {/* Large VISIBLE purple orb - right side */}
      <div 
        className="absolute -right-[100px] top-[35%] w-[700px] h-[700px] animate-float-2"
        style={{
          background: 'radial-gradient(circle, hsl(271 81% 60% / 0.4) 0%, hsl(271 81% 60% / 0.15) 40%, transparent 65%)',
          filter: 'blur(45px)'
        }}
      />

      {/* Bottom pink accent - visible */}
      <div 
        className="absolute left-[15%] -bottom-[150px] w-[600px] h-[600px] animate-float-3"
        style={{
          background: 'radial-gradient(circle, hsl(330 81% 60% / 0.35) 0%, hsl(330 81% 60% / 0.1) 40%, transparent 60%)',
          filter: 'blur(50px)'
        }}
      />

      {/* Secondary purple glow - bottom right */}
      <div 
        className="absolute right-[10%] -bottom-[100px] w-[500px] h-[500px]"
        style={{
          background: 'radial-gradient(circle, hsl(271 81% 55% / 0.3) 0%, transparent 60%)',
          filter: 'blur(60px)'
        }}
      />

      {/* Animated mesh gradient layer - more visible */}
      <div className="absolute inset-0">
        <div 
          className="absolute w-[900px] h-[900px] rounded-full blur-[80px] animate-gradient-mesh"
          style={{
            left: '5%',
            top: '10%',
            background: 'radial-gradient(circle, hsl(330 81% 60% / 0.25) 0%, transparent 55%)'
          }}
        />
        <div 
          className="absolute w-[700px] h-[700px] rounded-full blur-[80px] animate-gradient-mesh"
          style={{
            right: '0%',
            bottom: '5%',
            background: 'radial-gradient(circle, hsl(271 81% 60% / 0.2) 0%, transparent 55%)',
            animationDelay: '4s'
          }}
        />
      </div>

      {/* Gradient overlays for depth - STRONGER */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/25 via-transparent to-purple-500/20" />
      <div className="absolute inset-0 bg-gradient-to-tl from-purple-500/15 via-transparent to-pink-500/15" />
      
      {/* Top glow accent - MUCH stronger */}
      <div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-pink-500/20 via-purple-500/10 to-transparent" />
      
      {/* Subtle grid pattern overlay (Lovable-inspired) */}
      <div 
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(hsl(330 81% 60% / 0.4) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(330 81% 60% / 0.4) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Vignette effect - softer */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 90% 70% at 50% 35%, transparent 0%, rgba(0,0,0,0.5) 100%)'
        }}
      />

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

export default WebGenBackground;
