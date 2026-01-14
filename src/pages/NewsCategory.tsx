import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import PremiumBackground from "@/components/PremiumBackground";
import { getCategoryDisplayName, getCategoryEmoji } from "@/lib/newsStorage";

const NewsCategory = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();

  const categoryName = getCategoryDisplayName(categoryId || "");
  const categoryEmoji = getCategoryEmoji(categoryId || "");

  const timeFilters = [
    {
      id: "latest",
      name: "Latest News",
      description: "Most recent 3-5 stories",
      icon: Clock
    },
    {
      id: "week",
      name: "This Week News",
      description: "News from past 7 days",
      icon: Calendar
    },
    {
      id: "month",
      name: "This Month News",
      description: "News from past 30 days",
      icon: CalendarDays
    }
  ];

  const handleTimeFilterClick = (timeFilter: string) => {
    navigate(`/news/articles/${categoryId}/${timeFilter}`);
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative overflow-hidden">
      <PremiumBackground />

      {/* Header */}
      <header className="relative z-10 px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/news")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-md">
              <span className="text-xl">{categoryEmoji}</span>
            </div>
            <h1 className="font-bold text-lg text-foreground">{categoryName}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 relative z-10">
        <div className="mb-6">
          <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
            Choose time range
          </h2>
          <p className="text-muted-foreground">
            Select which news you'd like to see
          </p>
        </div>

        <div className="space-y-4">
          {timeFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleTimeFilterClick(filter.id)}
              className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 border border-border/50 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] text-left"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center flex-shrink-0 shadow-md">
                <filter.icon className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  {filter.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {filter.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default NewsCategory;