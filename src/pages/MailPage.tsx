import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Send, RefreshCw, User, Clock, Inbox, Loader2, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import PremiumBackground from '@/components/PremiumBackground';
import { supabase } from '@/integrations/supabase/client';

interface Email {
  id: string;
  from: string;
  fromName: string;
  subject: string;
  date: string;
  preview: string;
  isRead: boolean;
  body?: string;
}

const EMAIL_ACCOUNTS = [
  { value: 'support@notez.fun', label: 'Support' },
  { value: 'jones.smith@notez.fun', label: 'Jones Smith' }
];

const MailPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  
  // Compose form state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  const fetchEmails = async (account: string) => {
    if (!account) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-emails', {
        body: { account }
      });

      if (error) throw error;

      if (data.success) {
        setEmails(data.emails || []);
        toast.success(`Fetched ${data.emails?.length || 0} emails`);
      } else {
        throw new Error(data.error || 'Failed to fetch emails');
      }
    } catch (error: any) {
      console.error('Error fetching emails:', error);
      toast.error(error.message || 'Failed to fetch emails');
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountChange = (account: string) => {
    setSelectedAccount(account);
    setSelectedEmail(null);
    fetchEmails(account);
  };

  const handleRefresh = () => {
    if (selectedAccount) {
      fetchEmails(selectedAccount);
    }
  };

  const handleSendEmail = async () => {
    if (!composeTo || !composeSubject || !composeBody) {
      toast.error('Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email-smtp', {
        body: {
          account: selectedAccount,
          to: composeTo,
          subject: composeSubject,
          body: composeBody
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Email sent successfully!');
        setComposeOpen(false);
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
      } else {
        throw new Error(data.error || 'Failed to send email');
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(error.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <PremiumBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="rounded-full bg-card/50 backdrop-blur-sm border border-border/50 hover:bg-card/70 hover:border-primary/40 transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 shadow-[0_0_20px_rgba(236,72,153,0.2)]">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
                FARABI Mail
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedAccount && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="rounded-full bg-card/50 backdrop-blur-sm border border-border/50 hover:bg-card/70 hover:border-primary/40 transition-all duration-300"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  onClick={() => setComposeOpen(true)}
                  className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-primary-foreground rounded-xl px-4 py-2 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.4)] transition-all duration-300"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Account Selector */}
        <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-4 mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)] animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Which mail will you take?
            </label>
            <Select value={selectedAccount} onValueChange={handleAccountChange}>
              <SelectTrigger className="flex-1 bg-background/50 border-border/50 rounded-xl hover:border-primary/40 transition-all duration-300">
                <SelectValue placeholder="Select an email account..." />
              </SelectTrigger>
              <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50">
                {EMAIL_ACCOUNTS.map((account) => (
                  <SelectItem 
                    key={account.value} 
                    value={account.value}
                    className="hover:bg-primary/10 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      <span>{account.label}</span>
                      <span className="text-xs text-muted-foreground">({account.value})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Email List */}
        {!selectedAccount ? (
          <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-12 text-center shadow-[0_8px_32px_rgba(0,0,0,0.2)] animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Inbox className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Select an Email Account</h3>
            <p className="text-sm text-muted-foreground/70">Choose an account from the dropdown above to view your emails</p>
          </Card>
        ) : loading ? (
          <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-12 text-center shadow-[0_8px_32px_rgba(0,0,0,0.2)] animate-fade-in">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Mail className="w-12 h-12 text-primary/50" />
                <Loader2 className="w-6 h-6 text-primary absolute -bottom-1 -right-1 animate-spin" />
              </div>
              <p className="text-muted-foreground">Fetching emails...</p>
            </div>
          </Card>
        ) : emails.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-12 text-center shadow-[0_8px_32px_rgba(0,0,0,0.2)] animate-fade-in">
            <Inbox className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No Emails Yet</h3>
            <p className="text-sm text-muted-foreground/70">This inbox is empty</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {emails.map((email, index) => (
              <Card
                key={email.id}
                onClick={() => setSelectedEmail(selectedEmail?.id === email.id ? null : email)}
                className={`bg-card/50 backdrop-blur-xl border-border/50 p-4 cursor-pointer transition-all duration-300 hover:bg-card/70 hover:border-primary/40 hover:shadow-[0_8px_32px_rgba(236,72,153,0.15)] animate-fade-in ${
                  selectedEmail?.id === email.id ? 'border-primary/50 shadow-[0_8px_32px_rgba(236,72,153,0.2)]' : ''
                } ${!email.isRead ? 'border-l-2 border-l-primary' : ''}`}
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    !email.isRead 
                      ? 'bg-gradient-to-br from-primary to-purple-500 text-white' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {getInitials(email.fromName)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-medium truncate ${!email.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {email.fromName}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(email.date)}
                      </span>
                    </div>
                    <p className={`text-sm truncate mb-1 ${!email.isRead ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {email.subject}
                    </p>
                    <p className="text-xs text-muted-foreground/70 truncate">
                      {email.from}
                    </p>

                    {/* Expanded content */}
                    {selectedEmail?.id === email.id && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {email.preview || email.body || 'No content available'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Unread indicator */}
                  {!email.isRead && (
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-purple-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Compose Dialog */}
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50 shadow-[0_8px_32px_rgba(0,0,0,0.4)] max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                  <Send className="w-4 h-4 text-primary" />
                </div>
                <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                  Compose Email
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>From:</span>
                <span className="text-foreground">{selectedAccount}</span>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">To</label>
                <Input
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="bg-background/50 border-border/50 rounded-xl focus:border-primary/50 transition-all duration-300"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Subject</label>
                <Input
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Email subject..."
                  className="bg-background/50 border-border/50 rounded-xl focus:border-primary/50 transition-all duration-300"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Message</label>
                <Textarea
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Write your message..."
                  rows={6}
                  className="bg-background/50 border-border/50 rounded-xl focus:border-primary/50 transition-all duration-300 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setComposeOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={sending || !composeTo || !composeSubject || !composeBody}
                  className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-primary-foreground rounded-xl px-6 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.4)] transition-all duration-300"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MailPage;
