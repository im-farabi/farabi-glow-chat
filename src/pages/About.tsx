import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MessageSquare, Search, Brain, Image } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Chat
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            About Farabi's AI Chatbot
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Your free AI assistant with advanced capabilities including web search, reasoning, and image generation.
          </p>
        </div>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <MessageSquare className="h-12 w-12 mb-4 text-primary" />
                <CardTitle>AI Chat</CardTitle>
                <CardDescription>
                  Engage in natural conversations with advanced AI models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get instant responses, creative ideas, and helpful assistance for any task.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Search className="h-12 w-12 mb-4 text-primary" />
                <CardTitle>Web Search</CardTitle>
                <CardDescription>
                  Access real-time information from the web
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get up-to-date information, current events, and the latest data directly in your chat.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Brain className="h-12 w-12 mb-4 text-primary" />
                <CardTitle>Reasoning</CardTitle>
                <CardDescription>
                  Advanced problem-solving capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tackle complex problems with enhanced reasoning and logical thinking abilities.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Image className="h-12 w-12 mb-4 text-primary" />
                <CardTitle>Image Generation</CardTitle>
                <CardDescription>
                  Create stunning images from text
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Transform your ideas into beautiful images with AI-powered image generation.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">How to Use</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Choose Your Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Select from Chat, Web Search, Reasoning, or Image Generation mode depending on your needs.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Type Your Message</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Enter your question, request, or prompt in the message box at the bottom of the chat.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Get Instant Results</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Receive AI-powered responses instantly. All features are completely free with no signup required!
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-16" id="faq">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Is it really free?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! All features are completely free to use with no hidden costs or subscription fees.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Do I need to create an account?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No account required! Just start chatting immediately. Your chat history is saved locally in your browser.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What AI models are used?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We use state-of-the-art AI models to provide the best possible experience across all features.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Is my data private?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your conversations are stored locally in your browser. We respect your privacy and don't track your personal data.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="privacy" className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-center">Privacy Policy</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p>
                  At FARABI.me, we take your privacy seriously. This chatbot stores conversations locally in your browser's storage. 
                  We do not collect, store, or share your personal information or conversation history on our servers.
                </p>
                <p className="mt-4">
                  The AI models process your messages to generate responses, but these are not permanently stored or used for training purposes.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="terms" className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-center">Terms of Service</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p>
                  By using FARABI.me AI Chatbot, you agree to use the service responsibly and in accordance with applicable laws.
                </p>
                <ul className="mt-4 space-y-2">
                  <li>Do not use the service for illegal activities</li>
                  <li>Do not attempt to abuse or overload the service</li>
                  <li>Do not share harmful, offensive, or inappropriate content</li>
                  <li>The service is provided "as is" without warranties</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="text-center">
          <Link to="/">
            <Button size="lg" className="gap-2">
              <MessageSquare className="h-5 w-5" />
              Start Chatting Now
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default About;
