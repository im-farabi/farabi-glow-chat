import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, MessageSquare, DollarSign, Clock, Globe, Eye, ExternalLink, RefreshCw, Activity } from "lucide-react";

interface Website {
  id: string;
  anonymous_user_id: string;
  slug: string;
  title: string;
  views_count: number;
  created_at: string;
  is_published: boolean;
}

interface SharedNote {
  id: string;
  anonymous_user_id: string;
  slug: string;
  title: string;
  views_count: number;
  created_at: string;
}

interface DashboardData {
  activeUsers: {
    sessionId: string;
    anonymousUserId: string;
    countryName: string;
    countryCode: string;
    duration: number;
  }[];
  recentMessages: {
    id: string;
    role: string;
    content: string;
    anonymousUserId: string;
    countryName: string;
    createdAt: string;
    mode: string;
  }[];
  recentDonations: {
    id: string;
    donationType: string;
    amount: string;
    message: string;
    createdAt: string;
  }[];
  todayUsers: number;
  todayMessages: number;
  averageDuration: number;
  todayCountries: { countryName: string; userCount: number }[];
}

const Owner = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [petName, setPetName] = useState("");
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [sharedNotes, setSharedNotes] = useState<SharedNote[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('owner-dashboard', {
        body: { password, petName }
      });

      if (error) throw error;
      if (data) {
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, [password, petName]);

  const fetchWebsites = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('owner-websites', {
        body: { password, petName }
      });

      if (error) throw error;
      if (data) {
        setWebsites(data.websites || []);
        setSharedNotes(data.sharedNotes || []);
      }
    } catch (error) {
      console.error('Error fetching websites:', error);
    }
  }, [password, petName]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('owner-dashboard', {
        body: { password, petName }
      });

      if (error) throw error;

      if (data) {
        setIsAuthenticated(true);
        setDashboardData(data);
        await fetchWebsites();
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      alert('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboardData(), fetchWebsites()]);
    setRefreshing(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(fetchDashboardData, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchDashboardData]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
        
        <Card className="w-full max-w-md relative backdrop-blur-xl bg-slate-950/60 border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.15)]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Owner Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-900/50 border-blue-500/30 text-white focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <Label htmlFor="petName" className="text-slate-300">Pet Name</Label>
                <Input
                  id="petName"
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  className="bg-slate-900/50 border-blue-500/30 text-white focus:border-blue-500"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                disabled={loading}
              >
                {loading ? "Authenticating..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(96,165,250,0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="relative max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
              Owner Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">Real-time analytics and monitoring</p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="bg-slate-900/50 border-blue-500/30 hover:bg-slate-800/50 hover:border-blue-500/50 text-blue-400"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="backdrop-blur-xl bg-slate-950/60 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Users</p>
                  <p className="text-3xl font-bold text-blue-400 mt-2">{dashboardData.activeUsers.length}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-slate-950/60 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Today's Users</p>
                  <p className="text-3xl font-bold text-blue-400 mt-2">{dashboardData.todayUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-slate-950/60 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Messages</p>
                  <p className="text-3xl font-bold text-blue-400 mt-2">{dashboardData.todayMessages}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-slate-950/60 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Avg Duration</p>
                  <p className="text-3xl font-bold text-blue-400 mt-2">{formatDuration(dashboardData.averageDuration)}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList className="bg-slate-900/50 border border-blue-500/20 p-1">
            <TabsTrigger 
              value="analytics"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 data-[state=active]:shadow-[0_0_10px_rgba(59,130,246,0.3)]"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="websites"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 data-[state=active]:shadow-[0_0_10px_rgba(59,130,246,0.3)]"
            >
              Websites ({websites.length})
            </TabsTrigger>
            <TabsTrigger 
              value="notes"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 data-[state=active]:shadow-[0_0_10px_rgba(59,130,246,0.3)]"
            >
              Shared Notes ({sharedNotes.length})
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Users */}
              <Card className="backdrop-blur-xl bg-slate-950/60 border-blue-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-400">
                    <Activity className="h-5 w-5 mr-2 animate-pulse" />
                    Active Users ({dashboardData.activeUsers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                  {dashboardData.activeUsers.map((user, index) => (
                    <div 
                      key={user.sessionId}
                      className="p-3 bg-slate-900/50 border-l-2 border-blue-500 rounded hover:bg-slate-800/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-blue-400" />
                          <span className="text-sm font-medium text-slate-300">{user.countryName}</span>
                          <span className="text-xs text-slate-500">{user.countryCode}</span>
                        </div>
                        <Clock className="h-4 w-4 text-slate-500" />
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-mono">{user.anonymousUserId}</p>
                      <p className="text-xs text-blue-400 mt-1">Duration: {formatDuration(user.duration)}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Today's Traffic */}
              <Card className="backdrop-blur-xl bg-slate-950/60 border-blue-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-400">
                    <Globe className="h-5 w-5 mr-2" />
                    Today's Traffic by Country
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                  {dashboardData.todayCountries.map((country, index) => (
                    <div 
                      key={country.countryName}
                      className="p-3 bg-slate-900/50 border-l-2 border-blue-500 rounded hover:bg-slate-800/50 transition-all duration-300"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-300">{country.countryName}</span>
                        <span className="text-sm font-bold text-blue-400">{country.userCount} users</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Recent Messages */}
            <Card className="backdrop-blur-xl bg-slate-950/60 border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-400">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Recent Conversations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {dashboardData.recentMessages.map((message, index) => (
                  <div 
                    key={message.id}
                    className={`p-4 rounded-lg border-l-2 transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] ${
                      message.role === 'user' 
                        ? 'bg-slate-900/50 border-blue-500' 
                        : 'bg-slate-900/30 border-blue-400'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          message.role === 'user' 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-blue-400/20 text-blue-300'
                        }`}>
                          {message.role.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-500">{message.countryName}</span>
                        {message.mode && (
                          <span className="text-xs px-2 py-1 rounded bg-slate-700/50 text-slate-400">
                            {message.mode}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">{formatTimeAgo(message.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2">{message.content}</p>
                    <p className="text-xs text-slate-600 mt-1 font-mono">{message.anonymousUserId}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Donations */}
            {dashboardData.recentDonations.length > 0 && (
              <Card className="backdrop-blur-xl bg-slate-950/60 border-blue-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-400">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Recent Donations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dashboardData.recentDonations.map((donation, index) => (
                    <div 
                      key={donation.id}
                      className="p-3 bg-slate-900/50 border-l-2 border-blue-500 rounded hover:bg-slate-800/50 transition-all duration-300"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-300">{donation.donationType}</span>
                        <span className="text-sm font-bold text-blue-400">${donation.amount}</span>
                      </div>
                      {donation.message && (
                        <p className="text-xs text-slate-500 mt-1">{donation.message}</p>
                      )}
                      <p className="text-xs text-slate-600 mt-1">{formatTimeAgo(donation.createdAt)}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* User Websites Tab */}
          <TabsContent value="websites" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {websites.map((website, index) => (
                <Card 
                  key={website.id}
                  className="backdrop-blur-xl bg-slate-950/60 border-l-4 border-blue-500 hover:bg-slate-900/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-slate-200 line-clamp-1">{website.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        website.is_published 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {website.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-xs">
                      <p className="text-slate-400">Slug: <span className="text-blue-400 font-mono">/{website.slug}</span></p>
                      <p className="text-slate-400">User: <span className="text-slate-500 font-mono">{website.anonymous_user_id}</span></p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <div className="flex items-center gap-1 text-slate-400">
                          <Eye className="h-3 w-3" />
                          <span>{website.views_count}</span>
                        </div>
                        <span className="text-slate-500">{formatTimeAgo(website.created_at)}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-slate-900/50 border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500 text-blue-400"
                      onClick={() => window.open(`https://farabi.me/${website.slug}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      View Website
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Shared Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedNotes.map((note, index) => (
                <Card 
                  key={note.id}
                  className="backdrop-blur-xl bg-slate-950/60 border-l-4 border-blue-500 hover:bg-slate-900/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-slate-200 line-clamp-1">{note.title}</h3>
                    
                    <div className="space-y-1 text-xs">
                      <p className="text-slate-400">Slug: <span className="text-blue-400 font-mono">/notes/{note.slug}</span></p>
                      <p className="text-slate-400">User: <span className="text-slate-500 font-mono">{note.anonymous_user_id}</span></p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <div className="flex items-center gap-1 text-slate-400">
                          <Eye className="h-3 w-3" />
                          <span>{note.views_count}</span>
                        </div>
                        <span className="text-slate-500">{formatTimeAgo(note.created_at)}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-slate-900/50 border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500 text-blue-400"
                      onClick={() => window.open(`https://farabi.me/notes/${note.slug}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      View Note
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Owner;
