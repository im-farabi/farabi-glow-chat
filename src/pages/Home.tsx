import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ListChecks, Volume2, SquareStack, BadgeDollarSign, Zap, UserX } from 'lucide-react';
import { setHasVisited } from '@/lib/storage';
import LaserFlow from '@/components/LaserFlow';

const Home = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    setHasVisited();
    navigate('/c');
  };

  const features = [
    {
      icon: ListChecks,
      title: 'Generate MCQ',
      description: 'Generate MCQ and do a exam on any topic.'
    },
    {
      icon: Volume2,
      title: 'Voice Explain',
      description: 'Learn any topic with the best Voice Explanation!'
    },
    {
      icon: SquareStack,
      title: 'Flashcard Generator',
      description: 'Generate Flashcard to do Final Revision'
    }
  ];

  const benefits = [
    {
      icon: BadgeDollarSign,
      title: 'No Payment!',
      description: 'No Hidden Cost; 100% Lifetime Free!'
    },
    {
      icon: Zap,
      title: 'No Limit',
      description: 'Studying must be fun and with no Limits'
    },
    {
      icon: UserX,
      title: 'No Sign Up',
      description: 'Annoying "You have logged out" Instead your chats and history will auto saved in your device.'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* LaserFlow Background */}
      <div className="absolute inset-0 z-0">
        <LaserFlow 
          color="hsl(var(--primary))"
          horizontalBeamOffset={0}
          verticalBeamOffset={0}
          fogIntensity={0.3}
          wispIntensity={3}
        />
      </div>
      
      {/* Decorative background gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl z-0" />
      
      {/* Hero Section */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-6xl md:text-8xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-fade-in animate-scale-in">
          FARABI.me
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-16 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          "Best For Students!"
        </p>

        {/* Why Best for Students */}
        <div className="w-full max-w-6xl mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Why Best for Students?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="p-8 bg-card border-border hover:border-primary hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 hover:scale-105 transition-all duration-300 animate-fade-in group cursor-pointer"
                  style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                >
                  <div className="relative group mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300" />
                    <div className="relative bg-gradient-to-br from-primary/10 to-secondary/10 p-6 rounded-full border-2 border-primary/30 group-hover:scale-110 group-hover:border-primary transition-all duration-300 mx-auto w-fit">
                      <Icon className="h-16 w-16 text-primary" strokeWidth={2.5} />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Why FARABI.me */}
        <div className="w-full max-w-6xl mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-foreground animate-fade-in" style={{ animationDelay: '0.5s' }}>
            Why FARABI.me
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card 
                  key={index} 
                  className="p-8 bg-card border-border hover:border-secondary hover:shadow-2xl hover:shadow-secondary/20 hover:-translate-y-2 hover:scale-105 transition-all duration-300 animate-fade-in group cursor-pointer"
                  style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                >
                  <div className="relative group mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary/20 to-accent/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300" />
                    <div className="relative bg-gradient-to-br from-secondary/10 to-accent/10 p-6 rounded-full border-2 border-secondary/30 group-hover:scale-110 group-hover:border-secondary transition-all duration-300 mx-auto w-fit">
                      <Icon className="h-16 w-16 text-secondary" strokeWidth={2.5} />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* CTA Button */}
        <Button 
          onClick={handleGetStarted}
          size="lg"
          className="text-xl px-12 py-6 h-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90 hover:scale-110 hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 animate-fade-in animate-scale-in relative group"
          style={{ animationDelay: '0.9s' }}
        >
          <span className="relative z-10">GET STARTED</span>
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-8 px-4 animate-fade-in" style={{ animationDelay: '1.1s' }}>
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
          <a href="/terms" className="hover:text-primary transition-colors">
            Terms of Service
          </a>
          <a href="/privacy" className="hover:text-primary transition-colors">
            Privacy Policy
          </a>
          <a href="/about" className="hover:text-primary transition-colors">
            About me
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Home;
