import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Newspaper, Globe, Trophy, ArrowRight, Sparkles } from "lucide-react";
import PremiumBackground from "@/components/PremiumBackground";
import { getNewsUserProfile } from "@/lib/newsStorage";

interface CategoryCardProps {
  id: string;
  name: string;
  emoji: string;
  onClick: () => void;
}

const CategoryCard = ({ id, name, emoji, onClick }: CategoryCardProps) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 border border-border/50 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] min-w-[100px]"
  >
    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-3 shadow-md">
      <span className="text-2xl">{emoji}</span>
    </div>
    <span className="text-sm font-medium text-foreground">{name}</span>
  </button>
);

const WideCard = ({ id, name, emoji, onClick }: CategoryCardProps) => (
  <button
    onClick={onClick}
    className="flex items-center justify-between w-full p-5 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 border border-border/50 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-md">
        <span className="text-xl">{emoji}</span>
      </div>
      <span className="text-foreground font-semibold">{name}</span>
    </div>
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
      <ArrowRight className="w-4 h-4 text-primary" />
    </div>
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
      <header className="relative z-10 px-4 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20">
              <Newspaper className="w-6 h-6 text-primary" />
            </div>
            <div>
              <span className="font-bold text-xl">
                <span className="text-foreground">Quick</span>
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">News</span>
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3 h-3 text-primary/60" />
                <span className="text-xs text-muted-foreground">AI Powered</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-24 relative z-10 overflow-y-auto">
        {/* Greeting */}
        <div className="py-8">
          <h1 className="text-2xl font-bold">
            <span className="text-foreground">{greeting}, </span>
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{userName}</span>
            <span className="text-foreground">!</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            What news would you like to read today?
          </p>
        </div>

        {/* Countrywise News Section */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
              <Globe className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Countrywise News
            </h2>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
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
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Typewise News
            </h2>
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