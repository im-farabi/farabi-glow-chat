import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Header from '@/components/Header';

const Privacy = () => {
  useEffect(() => {
    document.title = "Privacy Policy - FARABI.me";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Privacy Policy for FARABI.me - How we handle your data and protect your privacy.');
    }
  }, []);

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
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="space-y-6 text-foreground/90">
            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">1. Introduction</h2>
              <p>
                At FARABI.me, we are committed to protecting your privacy. This Privacy Policy explains how we collect, 
                use, and safeguard information when you use our AI-powered educational chatbot platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium mb-2 mt-4">2.1 Automatically Collected Information</h3>
              <p className="mb-2">We automatically collect the following anonymous data:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li><strong>Session Data:</strong> Anonymous user ID, session ID, and session duration</li>
                <li><strong>Location Data:</strong> Country information derived from IP address (via geolocation)</li>
                <li><strong>Usage Data:</strong> Pages visited, features used, and interaction patterns</li>
                <li><strong>Technical Data:</strong> Browser type, device information, and user agent</li>
                <li><strong>Chat Messages:</strong> Your conversations with the AI chatbot (stored temporarily)</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 mt-4">2.2 Locally Stored Information</h3>
              <p className="mb-2">The following data is stored only in your browser using localStorage:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Chat history and conversations</li>
                <li>Generated content (images, MCQs, flashcards, audio)</li>
                <li>User preferences and settings</li>
                <li>Temporary chat mode status</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">3. How We Use Your Information</h2>
              <p className="mb-2">We use collected information for:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Providing and improving our AI chatbot services</li>
                <li>Monitoring service performance and identifying technical issues</li>
                <li>Understanding usage patterns and feature popularity</li>
                <li>Real-time analytics and monitoring (for owner dashboard)</li>
                <li>Ensuring service security and preventing abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">4. Data Storage and Retention</h2>
              
              <h3 className="text-xl font-medium mb-2 mt-4">4.1 Server-Side Data</h3>
              <p>
                Backend analytics data (chat messages, session information, usage statistics) is stored temporarily 
                for real-time monitoring purposes only. This data is not permanently retained and is designed for 
                short-term operational use.
              </p>

              <h3 className="text-xl font-medium mb-2 mt-4">4.2 Client-Side Data</h3>
              <p>
                All chat history, generated content, and preferences are stored locally in your browser. This data 
                remains on your device and is never uploaded to our servers unless you explicitly use features that 
                require server processing (like AI generation).
              </p>

              <h3 className="text-xl font-medium mb-2 mt-4">4.3 Temporary Content</h3>
              <p>
                YouTube video transcripts and similar temporary content are automatically deleted after 24 hours 
                or can be deleted immediately by the user.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">5. Anonymous Usage</h2>
              <p>
                FARABI.me operates without requiring user accounts, authentication, or personally identifiable information. 
                Each browser session receives a randomly generated user ID that cannot be traced back to your identity. 
                We do not collect names, email addresses, or any personal identifiers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">6. Third-Party Services</h2>
              <p className="mb-2">We integrate with the following third-party services:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li><strong>Pollinations AI:</strong> For AI chat, image generation, and text-to-speech</li>
                <li><strong>Supabase:</strong> For backend infrastructure and edge functions</li>
                <li><strong>IP Geolocation Services:</strong> For country-level location data</li>
              </ul>
              <p className="mt-2">
                These services may have their own privacy policies. We proxy requests through our backend to protect 
                API keys and add an additional layer of privacy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">7. Cookies and Tracking</h2>
              <p>
                We use browser localStorage and sessionStorage for functionality purposes only. We do not use traditional 
                cookies for tracking. No third-party advertising or analytics cookies are used on our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">8. Data Security</h2>
              <p>
                We implement security measures to protect data transmission and storage:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>HTTPS encryption for all communications</li>
                <li>API keys stored securely in backend secrets</li>
                <li>No permanent storage of sensitive user data</li>
                <li>Regular security reviews and updates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">9. Your Rights and Choices</h2>
              <p className="mb-2">You have the following rights regarding your data:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li><strong>Access:</strong> All locally stored data is accessible through your browser's developer tools</li>
                <li><strong>Deletion:</strong> You can clear chat history and stored content at any time through the app interface</li>
                <li><strong>Control:</strong> Use temporary chat mode to prevent conversations from being saved</li>
                <li><strong>Browser Control:</strong> Clear localStorage to remove all locally stored data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">10. Children's Privacy</h2>
              <p>
                FARABI.me is an educational tool suitable for students of all ages. We do not knowingly collect personal 
                information from anyone, including children. Since we operate anonymously without authentication, no 
                age-specific data is collected.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">11. International Users</h2>
              <p>
                Our service is accessible globally. We only collect country-level location data for analytics purposes. 
                Data is processed in accordance with applicable data protection regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">12. Owner Dashboard</h2>
              <p>
                The owner dashboard displays real-time analytics including active users by country, conversation monitoring, 
                and usage statistics. This dashboard is password-protected and accessible only to authorized administrators 
                for service monitoring and improvement purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">13. Changes to Privacy Policy</h2>
              <p>
                We may update this Privacy Policy periodically. Changes will be posted on this page with an updated 
                "Last updated" date. Continued use of the service after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">14. Contact Us</h2>
              <p>
                If you have questions or concerns about this Privacy Policy or how we handle data, please contact us 
                through the chat interface or visit our main website for additional contact information.
              </p>
            </section>

            <section className="mt-8 p-4 bg-accent/20 rounded-lg border border-border">
              <h2 className="text-xl font-semibold mb-2 text-foreground">Summary</h2>
              <p className="text-sm">
                <strong>In short:</strong> FARABI.me operates anonymously without collecting personal information. 
                Chat history is stored locally in your browser. We collect temporary, anonymous analytics data 
                (country, usage patterns, chat messages) for service improvement. No data is sold to third parties. 
                You maintain full control over your locally stored data.
              </p>
            </section>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Privacy;
