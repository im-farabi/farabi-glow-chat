import React from 'react';

interface AnimatedBackgroundProps {
  theme: 'purple' | 'white' | 'orange';
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ theme }) => {
  const gradients = {
    purple: 'from-purple-900 via-violet-800 to-black/95',
    white: 'from-zinc-800 via-slate-700 to-black/95',
    orange: 'from-orange-900 via-amber-800 to-black/95'
  };

  const overlays = {
    purple: 'bg-purple-500/8',
    white: 'bg-white/8',
    orange: 'bg-orange-500/8'
  };

  const particles = {
    purple: 'bg-purple-500/8',
    white: 'bg-gray-300/8',
    orange: 'bg-orange-500/8'
  };

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Animated gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradients[theme]} animate-gradient`} />
      
      {/* Theme tinted overlay */}
      <div className={`absolute inset-0 ${overlays[theme]}`} />
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${particles[theme]} blur-xl`}
            style={{
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 20 + 15}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_50%)]" />
    </div>
  );
};
