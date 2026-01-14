import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Newspaper, Library, Globe, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PremiumBackground from "@/components/PremiumBackground";
import { getNewsUserProfile, getCategoryEmoji } from "@/lib/newsStorage";

interface CategoryCardProps {
  id: string;
  name: string;
  emoji: string;
  onClick: () => void;
}

const CategoryCard = ({ id, name, emoji, onClick }: CategoryCardProps) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm hover:bg-card/70 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] min-w-[100px]"
  >
    <span className="text-3xl mb-2">{emoji}</span>
    <span className="text-sm text-muted-foreground text-center leading-tight">{name}</span>
  </button>
);

const WideCard = ({ id, name, emoji, onClick }: CategoryCardProps) => (
  <button
    onClick={onClick}
    className="flex items-center justify-between w-full p-4 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm hover:bg-card/70 hover:border-primary/30 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
  >
    <div className="flex items-center gap-3">
      <span className="text-2xl">{emoji}</span>
      <span className="text-foreground font-medium">{name}</span>
    </div>
    <ArrowRight className="w-5 h-5 text-muted-foreground" />
  </button>
);

const NewsHome = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Reader");

  useEffect(() => {
    const profile = getNewsUserProfile();
    if (profile?.name) {
      setUserName(profile.name);
    }
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const countrywiseCategories = [
    { id: "philippines", name: "Philippines", emoji: "🇵🇭" },
    { id: "united-states", name: "US", emoji: "🇺🇸" },
    { id: "bangladesh", name: "Bangladesh", emoji: "🇧🇩" }
  ];

  const typewiseCategories = [
    { id: "football", name: "Football", emoji: "⚽" },
    { id: "basketball", name: "Basketball", emoji: "🏀" },
    { id: "series", name: "Series", emoji: "📺" }
  ];

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/news/category/${categoryId}`);
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative overflow-hidden">
      <PremiumBackground />

      {/* Header */}
      <header className="relative z-10 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg">
              <span className="text-foreground">Quick</span>
              <span className="text-primary">News</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-24 relative z-10 overflow-y-auto">
        {/* Greeting */}
        <div className="py-6">
          <h1 className="text-2xl font-bold text-foreground">
            {greeting}, <span className="text-primary">{userName}</span>!
          </h1>
          <p className="text-muted-foreground mt-1">
            What news would you like to read today?
          </p>
        </div>

        {/* Countrywise News Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Countrywise News</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-3">
            {countrywiseCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                id={cat.id}
                name={cat.name}
                emoji={cat.emoji}
                onClick={() => handleCategoryClick(cat.id)}
              />
            ))}
          </div>

          <WideCard
            id="all-asian"
            name="All-Asian News"
            emoji="🌏"
            onClick={() => handleCategoryClick("all-asian")}
          />
        </section>

        {/* Typewise News Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Typewise News</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {typewiseCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                id={cat.id}
                name={cat.name}
                emoji={cat.emoji}
                onClick={() => handleCategoryClick(cat.id)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default NewsHome;
