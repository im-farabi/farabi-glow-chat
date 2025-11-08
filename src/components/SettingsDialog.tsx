import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getUserPreferences, saveUserPreferences, getCursorPreference, saveCursorPreference, type UserPreferences } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { AlertCircle } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OCCUPATION_OPTIONS = ['Student', 'Employed', 'Unemployed', 'Businessman'];
const INTEREST_OPTIONS = ['Coding', 'Gaming', 'Normal Curiosity', 'Random Stuff', 'Scientific', 'Comedy'];

const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [preferences, setPreferences] = useState<UserPreferences>({
    name: '',
    occupation: '',
    interests: [],
    cursorType: 'default'
  });
  const [cursorType, setCursorType] = useState<'default' | 'professional' | 'cartoony'>('default');

  useEffect(() => {
    if (open) {
      const savedPrefs = getUserPreferences();
      setPreferences(savedPrefs);
      setCursorType(getCursorPreference());
    }
  }, [open]);

  const handleInterestToggle = (interest: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSavePersonalization = () => {
    saveUserPreferences(preferences);
    toast({
      title: "Saved!",
      description: "Your personalization preferences have been saved",
    });
  };

  const handleSaveCursor = () => {
    saveCursorPreference(cursorType);
    // Apply cursor immediately
    document.body.className = document.body.className.replace(/cursor-\w+/g, '').trim();
    document.body.classList.add(`cursor-${cursorType}`);
    toast({
      title: "Cursor Updated!",
      description: `${cursorType === 'default' ? 'Default' : cursorType.charAt(0).toUpperCase() + cursorType.slice(1)} cursor applied`,
    });
    onOpenChange(false);
  };

  const username = preferences.name.trim() || 'Anonymous';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Welcome {username}!</DialogTitle>
          <DialogDescription>Customize the AI</DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="personalization" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personalization">Personalization</TabsTrigger>
            <TabsTrigger value="cursors">Cursors</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personalization" className="space-y-6 py-4">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name">What AI should call you:</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={preferences.name}
                onChange={(e) => setPreferences(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* Occupation Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="occupation">Who are you:</Label>
              <Select
                value={preferences.occupation}
                onValueChange={(value) => setPreferences(prev => ({ ...prev, occupation: value }))}
              >
                <SelectTrigger id="occupation">
                  <SelectValue placeholder="Select your status" />
                </SelectTrigger>
                <SelectContent>
                  {OCCUPATION_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Interests Multi-select */}
            <div className="space-y-3">
              <Label>What are you most about:</Label>
              <div className="space-y-2">
                {INTEREST_OPTIONS.map(interest => (
                  <div key={interest} className="flex items-center space-x-2">
                    <Checkbox
                      id={interest}
                      checked={preferences.interests.includes(interest)}
                      onCheckedChange={() => handleInterestToggle(interest)}
                    />
                    <label
                      htmlFor={interest}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {interest}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePersonalization}>
                Save Changes
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="cursors" className="space-y-6 py-4">
            {isMobile ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This feature only available in Desktops.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <RadioGroup value={cursorType} onValueChange={(value: any) => setCursorType(value)}>
                  <div className="space-y-4">
                    {/* Default Cursor */}
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="default" id="default" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="default" className="text-base font-medium cursor-pointer">
                          Default Cursor
                        </Label>
                        <p className="text-sm text-muted-foreground mb-3">Browser default cursor</p>
                        <div className="w-full h-24 border rounded-md flex items-center justify-center bg-muted/30">
                          <p className="text-sm text-muted-foreground">Standard cursor</p>
                        </div>
                      </div>
                    </div>

                    {/* Professional Cursor */}
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="professional" id="professional" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="professional" className="text-base font-medium cursor-pointer">
                          Professional Cursor
                        </Label>
                        <p className="text-sm text-muted-foreground mb-3">Sleek purple arrow cursor</p>
                        <div 
                          className="w-full h-24 border rounded-md flex items-center justify-center bg-muted/30"
                          style={{ cursor: 'url(/cursors/professional-cursor.png) 0 0, auto' }}
                        >
                          <p className="text-sm text-muted-foreground">Hover to preview</p>
                        </div>
                      </div>
                    </div>

                    {/* Cartoony Cursor */}
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="cartoony" id="cartoony" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="cartoony" className="text-base font-medium cursor-pointer">
                          Cartoony Cursor
                        </Label>
                        <p className="text-sm text-muted-foreground mb-3">Fun character cursor</p>
                        <div 
                          className="w-full h-24 border rounded-md flex items-center justify-center bg-muted/30"
                          style={{ cursor: 'url(/cursors/cartoony-cursor.png) 0 0, auto' }}
                        >
                          <p className="text-sm text-muted-foreground">Hover to preview</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </RadioGroup>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveCursor}>
                    Apply Cursor
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
