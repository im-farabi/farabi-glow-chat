const WebGenBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Deep black base */}
      <div className="absolute inset-0 bg-black" />
      
      {/* Animated gradient orbs - pink/purple for visual interest */}
      <div 
        className="absolute -left-[400px] top-[10%] w-[800px] h-[800px] animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 60%)',
          filter: 'blur(100px)',
          animationDuration: '8s'
        }}
      />
      
      <div 
        className="absolute -right-[300px] top-[30%] w-[700px] h-[700px] animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 60%)',
          filter: 'blur(100px)',
          animationDuration: '10s',
          animationDelay: '2s'
        }}
      />
      
      <div 
        className="absolute left-[30%] bottom-[-200px] w-[600px] h-[600px] animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 60%)',
          filter: 'blur(80px)',
          animationDuration: '12s',
          animationDelay: '4s'
        }}
      />
      
      {/* Central light beam effect */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-[60%]"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)'
        }}
      />
      
      {/* Horizontal glow line */}
      <div 
        className="absolute top-[40%] left-0 right-0 h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.15) 50%, transparent 100%)'
        }}
      />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      />

      {/* Vignette for depth */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 40%, transparent 0%, rgba(0,0,0,0.7) 100%)'
        }}
      />

      {/* Noise texture */}
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
