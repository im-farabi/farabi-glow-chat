const WebGenBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Pure black base */}
      <div className="absolute inset-0 bg-black" />
      
      {/* Subtle top gradient for depth */}
      <div 
        className="absolute top-0 left-0 right-0 h-[60%]"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)'
        }}
      />
      
      {/* Very subtle side glows */}
      <div 
        className="absolute -left-[300px] top-[20%] w-[600px] h-[600px]"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.015) 0%, transparent 60%)',
          filter: 'blur(80px)'
        }}
      />
      
      <div 
        className="absolute -right-[200px] top-[40%] w-[500px] h-[500px]"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.01) 0%, transparent 60%)',
          filter: 'blur(80px)'
        }}
      />
      
      {/* Subtle grid pattern - very faint */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Vignette for depth */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, transparent 0%, rgba(0,0,0,0.6) 100%)'
        }}
      />

      {/* Noise texture - very subtle */}
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
