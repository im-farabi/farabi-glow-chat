import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ListChecks, Volume2, SquareStack, DollarSign, Infinity, UserX } from 'lucide-react';
import { setHasVisited } from '@/lib/storage';

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
      icon: DollarSign,
      title: 'No Payment!',
      description: 'No Hidden Cost; 100% Lifetime Free!'
    },
    {
      icon: Infinity,
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-6xl md:text-8xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          FARABI.me
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-16">
          "Best For Students!"
        </p>

        {/* Why Best for Students */}
        <div className="w-full max-w-6xl mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-foreground">
            Why Best for Students?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="p-6 bg-card border-border hover:border-primary transition-colors">
                  <Icon className="h-12 w-12 mb-4 text-primary mx-auto" />
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Why FARABI.me */}
        <div className="w-full max-w-6xl mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-foreground">
            Why FARABI.me
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="p-6 bg-card border-border hover:border-secondary transition-colors">
                  <Icon className="h-12 w-12 mb-4 text-secondary mx-auto" />
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
          className="text-xl px-12 py-6 h-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
        >
          GET STARTED
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
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
