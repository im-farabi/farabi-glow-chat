import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { getUserPreferences, saveUserPreferences, type UserPreferences } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface PersonalizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OCCUPATION_OPTIONS = ['Student', 'Employed', 'Unemployed', 'Businessman'];
const INTEREST_OPTIONS = ['Coding', 'Gaming', 'Normal Curiosity', 'Random Stuff', 'Scientific', 'Comedy'];

const PersonalizationDialog = ({ open, onOpenChange }: PersonalizationDialogProps) => {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences>({
    name: '',
    occupation: '',
    interests: []
  });

  useEffect(() => {
    if (open) {
      const savedPrefs = getUserPreferences();
      setPreferences(savedPrefs);
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

  const handleSave = () => {
    saveUserPreferences(preferences);
    toast({
      title: "Saved!",
      description: "Your personalization preferences have been saved",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Personalization</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PersonalizationDialog;
