import React from 'react';

interface AnimatedBackgroundProps {
  theme: 'purple' | 'white' | 'orange';
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ theme }) => {
  const gradients = {
    purple: 'from-purple-950 via-violet-900 to-black',
    white: 'from-gray-900 via-slate-800 to-black',
    orange: 'from-orange-950 via-amber-900 to-black'
  };

  const particles = {
    purple: 'bg-purple-500/10',
    white: 'bg-gray-300/10',
    orange: 'bg-orange-500/10'
  };

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Animated gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradients[theme]} animate-gradient`} />
      
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
