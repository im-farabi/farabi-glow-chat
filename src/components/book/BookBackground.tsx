const BookBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
      {/* Dark gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />
      
      {/* Smoky orbs */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 animate-float-1"
        style={{
          background: 'radial-gradient(circle, rgba(39,39,42,0.8) 0%, transparent 70%)',
          top: '-10%',
          left: '-10%',
        }}
      />
      <div 
        className="absolute w-[500px] h-[500px] rounded-full opacity-15 animate-float-2"
        style={{
          background: 'radial-gradient(circle, rgba(63,63,70,0.6) 0%, transparent 70%)',
          top: '40%',
          right: '-15%',
        }}
      />
      <div 
        className="absolute w-[400px] h-[400px] rounded-full opacity-20 animate-float-3"
        style={{
          background: 'radial-gradient(circle, rgba(39,39,42,0.7) 0%, transparent 70%)',
          bottom: '-5%',
          left: '20%',
        }}
      />
      
      {/* Orange/warm glow accent in corner */}
      <div 
        className="absolute w-[300px] h-[300px] rounded-full opacity-10 animate-pulse-slow"
        style={{
          background: 'radial-gradient(circle, rgba(249,115,22,0.4) 0%, transparent 70%)',
          bottom: '10%',
          right: '5%',
        }}
      />
      
      {/* Subtle top-left warm glow */}
      <div 
        className="absolute w-[400px] h-[400px] rounded-full opacity-5"
        style={{
          background: 'radial-gradient(circle, rgba(234,88,12,0.3) 0%, transparent 70%)',
          top: '5%',
          left: '30%',
        }}
      />
      
      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Vignette effect */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }}
      />
    </div>
  );
};

export default BookBackground;
