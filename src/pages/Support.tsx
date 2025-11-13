import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Bitcoin, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Header from '@/components/Header';

const Support = () => {
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [donationType, setDonationType] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!donationType || !amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const anonymousUserId = localStorage.getItem('anonymousUserId') || 'unknown';
      
      const { error } = await supabase
        .from('donations')
        .insert({
          anonymous_user_id: anonymousUserId,
          donation_type: donationType,
          amount,
          message: message || null
        });

      if (error) throw error;

      toast.success('Thank you for your donation! 💖');
      setShowDonationForm(false);
      setDonationType('');
      setAmount('');
      setMessage('');
    } catch (error) {
      console.error('Error submitting donation:', error);
      toast.error('Failed to submit donation notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/5">
      <Header />
      <main className="flex-1 container max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <Card className="border-2 md:border-4 p-6 md:p-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-base md:text-lg mb-4"
            >
              <Link to="/">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Chat
              </Link>
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Support FARABI.me</h1>
            <p className="text-muted-foreground text-lg">
              You can support us by donating money or watching some ads!
            </p>
          </div>

          <div className="space-y-8">
            {/* ADS Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <ExternalLink className="h-6 w-6" />
                Watch Ads
              </h2>
              <p className="text-muted-foreground mb-4">
                Support us by watching advertisements. Every view helps keep FARABI.me free!
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="flex-1 min-w-[200px]"
                >
                  <Link to="/ad">
                    WATCH AD
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="flex-1 min-w-[200px]"
                >
                  <Link to="/lovable">
                    WATCH AD
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </section>

            {/* Donations Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-6 w-6" />
                Donations
              </h2>
              
              {/* MrBeast Donation */}
              <div className="mb-6 p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/20">
                <h3 className="text-xl font-semibold mb-2">Donate to MrBeast In Behalf of Us!</h3>
                <p className="text-muted-foreground mb-4">
                  Support an amazing cause! Donations go to Beast Philanthropy to help people around the world.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 w-full md:w-auto"
                >
                  <Link to="/donate" target="_blank">
                    Donate to Beast Philanthropy
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Crypto Donations */}
              <div className="p-4 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-lg border border-orange-500/20">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Bitcoin className="h-6 w-6" />
                  Pay Us Via CryptoCurrency!
                </h3>
                
                <div className="space-y-4 mb-4">
                  <div>
                    <Label className="text-sm font-medium">Litecoin Address:</Label>
                    <div className="bg-background/50 p-3 rounded border mt-1 break-all font-mono text-sm">
                      LTYhaXLQQZmUwrpV2yZdQhz4ifQsUPhQDF
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Tether USDT:</Label>
                    <div className="bg-background/50 p-3 rounded border mt-1 break-all font-mono text-sm">
                      0xDaB328f200dd1443494acdBcBdf0b93E0f0C550a
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Bitcoin Address:</Label>
                    <div className="bg-background/50 p-3 rounded border mt-1 break-all font-mono text-sm">
                      bc1qaqfr3jvxkyd69ufd9vaqxnwk36cek0mf3ph9dy
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setShowDonationForm(true)}
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 w-full"
                >
                  I have Donated!
                </Button>
              </div>
            </section>
          </div>
        </Card>
      </main>

      {/* Donation Form Dialog */}
      <Dialog open={showDonationForm} onOpenChange={setShowDonationForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thank You for Your Support! 💖</DialogTitle>
            <DialogDescription>
              Please let us know about your donation so we can track and thank our supporters.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleDonationSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="donationType">How did you donate?*</Label>
              <Select value={donationType} onValueChange={setDonationType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select donation method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mrbeast">MrBeast Donation</SelectItem>
                  <SelectItem value="crypto_ltc">Crypto [LTC]</SelectItem>
                  <SelectItem value="crypto_btc">Crypto [BTC]</SelectItem>
                  <SelectItem value="usdt">USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">How much did you donate?*</Label>
              <Input
                id="amount"
                placeholder="e.g., $10, 0.001 BTC, 50 LTC"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Type your message:</Label>
              <Textarea
                id="message"
                placeholder="Leave a message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Support;
