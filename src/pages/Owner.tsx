import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Users, MessageSquare, Clock, Globe, Activity, RefreshCw } from 'lucide-react';

interface DashboardData {
  activeSessions: Array<{
    anonymous_user_id: string;
    session_id: string;
    session_start: string;
    last_activity: string;
    country_name: string;
    country_code: string;
  }>;
  recentMessages: Array<{
    id: string;
    anonymous_user_id: string;
    role: string;
    content: string;
    created_at: string;
    country_name: string | null;
    country_code: string | null;
  }>;
  stats: {
    activeUsers: number;
    uniqueUsersToday: number;
    todayMessageCount: number;
    todaySessionCount: number;
    avgSessionDuration: number;
    countryStats: Record<string, number>;
  };
}

export default function Owner() {
  const [password, setPassword] = useState('');
  const [petName, setPetName] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const fetchDashboardData = useCallback(async (showToast = false) => {
    try {
      const { data, error } = await supabase.functions.invoke('owner-dashboard', {
        body: { password, petName }
      });

      if (error) throw error;

      if (data.error) {
        toast.error('Failed to refresh data');
        return;
      }

      setDashboardData(data.data);
      if (showToast) {
        toast.success('Dashboard refreshed');
      }
    } catch (error) {
      console.error('Refresh error:', error);
      if (showToast) {
        toast.error('Failed to refresh');
      }
    }
  }, [password, petName]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('owner-dashboard', {
        body: { password, petName }
      });

      if (error) throw error;

      if (data.error) {
        toast.error('Invalid credentials');
        return;
      }

      setIsAuthenticated(true);
      setDashboardData(data.data);
      toast.success('Welcome, Owner!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData(true);
    setIsRefreshing(false);
  };

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchDashboardData]);

  const formatTimeAgo = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const formatDuration = (start: string, end: string) => {
    const minutes = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000 / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/10 to-accent/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Owner Dashboard</CardTitle>
            <CardDescription>Enter credentials to access analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pet's Name</label>
                <Input
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder="Enter pet's name"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Authenticating...' : 'Access Dashboard'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-accent/5 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Owner Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge variant="secondary" className="gap-2">
              <Activity className="h-4 w-4" />
              Auto-refresh: 5s
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">Online now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.uniqueUsersToday}</div>
              <p className="text-xs text-muted-foreground">{dashboardData.stats.todaySessionCount} sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages Today</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.todayMessageCount}</div>
              <p className="text-xs text-muted-foreground">Total conversations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.avgSessionDuration}m</div>
              <p className="text-xs text-muted-foreground">Per active session</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Users by Country */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Active Users by Country
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {dashboardData.activeSessions.map((session) => (
                    <div key={session.session_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <p className="font-mono text-sm">{session.anonymous_user_id}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.country_name || 'Unknown'} • {formatDuration(session.session_start, session.last_activity)}
                        </p>
                      </div>
                      <Badge variant="outline">{formatTimeAgo(session.last_activity)}</Badge>
                    </div>
                  ))}
                  {dashboardData.activeSessions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No active users</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Country Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Today's Traffic by Country
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {Object.entries(dashboardData.stats.countryStats)
                    .sort(([, a], [, b]) => b - a)
                    .map(([country, count]) => (
                      <div key={country} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <span className="text-sm">{country}</span>
                        <Badge>{count} users</Badge>
                      </div>
                    ))}
                  {Object.keys(dashboardData.stats.countryStats).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Live Conversation Monitor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Conversations
            </CardTitle>
            <CardDescription>Latest 100 messages from all users</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {dashboardData.recentMessages.map((msg) => (
                  <div key={msg.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={msg.role === 'user' ? 'default' : 'secondary'}>
                          {msg.role}
                        </Badge>
                        <span className="font-mono text-sm text-muted-foreground">
                          {msg.anonymous_user_id}
                        </span>
                        {msg.country_name && (
                          <Badge variant="outline">{msg.country_name}</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.content.length > 500 ? msg.content.substring(0, 500) + '...' : msg.content}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
