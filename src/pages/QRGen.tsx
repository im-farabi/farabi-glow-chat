import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Header from '@/components/Header';

const QRGen = () => {
  const [text, setText] = useState('');

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              QR Code Generator
            </h1>
            <p className="text-muted-foreground">
              Generate QR codes for your links and text
            </p>
          </div>

          <Card className="p-6 space-y-4 bg-card border-border">
            <Input
              placeholder="Enter text or URL..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            
            <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
              Generate QR Code
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default QRGen;
