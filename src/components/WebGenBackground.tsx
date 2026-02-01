const WebGenBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Pure black base */}
      <div className="absolute inset-0 bg-black" />
      
      {/* Central vertical light beam (Huly-inspired) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-full">
        <div 
          className="absolute inset-0 animate-pulse-slow"
          style={{
            background: 'linear-gradient(180deg, hsl(271 81% 60% / 0.4) 0%, hsl(330 81% 60% / 0.2) 30%, transparent 70%)',
            maskImage: 'radial-gradient(ellipse 100% 100% at 50% 0%, black 0%, transparent 60%)',
            WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 50% 0%, black 0%, transparent 60%)'
          }}
        />
        {/* Inner glow */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, hsl(330 81% 60% / 0.5) 0%, hsl(271 81% 60% / 0.15) 40%, transparent 60%)',
            maskImage: 'radial-gradient(ellipse 40% 80% at 50% 0%, black 0%, transparent 50%)',
            WebkitMaskImage: 'radial-gradient(ellipse 40% 80% at 50% 0%, black 0%, transparent 50%)'
          }}
        />
      </div>

      {/* Large pink orb - left side (brain.fm-inspired asymmetric glow) */}
      <div 
        className="absolute -left-[300px] top-[10%] w-[900px] h-[900px] animate-float-1"
        style={{
          background: 'radial-gradient(circle, hsl(330 81% 60% / 0.25) 0%, hsl(330 81% 60% / 0.1) 40%, transparent 70%)',
          filter: 'blur(80px)'
        }}
      />

      {/* Large purple orb - right side */}
      <div 
        className="absolute -right-[200px] top-[40%] w-[700px] h-[700px] animate-float-2"
        style={{
          background: 'radial-gradient(circle, hsl(271 81% 60% / 0.3) 0%, hsl(271 81% 60% / 0.1) 40%, transparent 70%)',
          filter: 'blur(80px)'
        }}
      />

      {/* Bottom pink accent */}
      <div 
        className="absolute left-[20%] -bottom-[200px] w-[600px] h-[600px] animate-float-3"
        style={{
          background: 'radial-gradient(circle, hsl(330 81% 60% / 0.2) 0%, transparent 60%)',
          filter: 'blur(100px)'
        }}
      />

      {/* Animated mesh gradient layer */}
      <div className="absolute inset-0">
        <div 
          className="absolute w-[1000px] h-[1000px] rounded-full opacity-20 blur-[120px] animate-gradient-mesh"
          style={{
            left: '10%',
            top: '5%',
            background: 'radial-gradient(circle, hsl(330 81% 60% / 0.4) 0%, transparent 60%)'
          }}
        />
        <div 
          className="absolute w-[800px] h-[800px] rounded-full opacity-20 blur-[120px] animate-gradient-mesh"
          style={{
            right: '5%',
            bottom: '10%',
            background: 'radial-gradient(circle, hsl(271 81% 60% / 0.4) 0%, transparent 60%)',
            animationDelay: '3s'
          }}
        />
      </div>

      {/* Gradient overlays for depth - higher opacity than PremiumBackground */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/15 via-transparent to-purple-500/15" />
      <div className="absolute inset-0 bg-gradient-to-tl from-purple-500/10 via-transparent to-pink-500/10" />
      
      {/* Top glow accent */}
      <div className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-purple-500/10 via-pink-500/5 to-transparent" />
      
      {/* Subtle grid pattern overlay (Lovable-inspired) */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(330 81% 60% / 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(330 81% 60% / 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Vignette effect - darker edges */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, transparent 0%, rgba(0,0,0,0.4) 100%)'
        }}
      />

      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          backgroundRepeat: 'repeat'
        }}
      />
    </div>
  );
};

export default WebGenBackground;
