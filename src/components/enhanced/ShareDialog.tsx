
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Copy, Share2, Mail, Link } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

const ShareDialog = ({ open, onOpenChange, projectId, projectName }: ShareDialogProps) => {
  const { user } = useAuth();
  const [shareMethod, setShareMethod] = useState<'link' | 'email'>('link');
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [shareToken, setShareToken] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const generateShareLink = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000) : null;

      const { data, error } = await supabase
        .from('shared_projects')
        .insert({
          project_id: projectId,
          shared_by: user.id,
          permission_level: permission,
          expires_at: expiresAt
        })
        .select('share_token')
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/shared/${data.share_token}`;
      setShareToken(link);

      // Copy to clipboard
      await navigator.clipboard.writeText(link);
      
      toast({
        title: "Share link generated",
        description: "Link copied to clipboard"
      });
    } catch (error) {
      console.error('Error generating share link:', error);
      toast({
        title: "Error",
        description: "Failed to generate share link",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const shareViaEmail = async () => {
    if (!user || !email.trim()) return;

    setLoading(true);
    try {
      // First, check if user exists
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim())
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      if (profiles) {
        // Share directly with existing user
        const { error } = await supabase
          .from('shared_projects')
          .insert({
            project_id: projectId,
            shared_by: user.id,
            shared_with: profiles.id,
            permission_level: permission
          });

        if (error) throw error;

        toast({
          title: "Project shared",
          description: `Project shared with ${email}`
        });
      } else {
        // Generate invite link for non-user
        await generateShareLink();
        
        toast({
          title: "Invite link generated",
          description: `Send the link to ${email} to invite them`
        });
      }

      setEmail('');
    } catch (error) {
      console.error('Error sharing project:', error);
      toast({
        title: "Error",
        description: "Failed to share project",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-violet-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-violet-400" />
            Share "{projectName}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <RadioGroup value={shareMethod} onValueChange={(value: 'link' | 'email') => setShareMethod(value)}>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="link" id="link" />
                <Label htmlFor="link" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Share via link
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Share via email
                </Label>
              </div>
            </div>
          </RadioGroup>

          {shareMethod === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="email-input">Email address</Label>
              <Input
                id="email-input"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
          )}

          <div className="space-y-4">
            <Label>Permission level</Label>
            <RadioGroup value={permission} onValueChange={(value: 'view' | 'edit') => setPermission(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="view" id="view" />
                <Label htmlFor="view">View only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="edit" id="edit" />
                <Label htmlFor="edit">Can edit</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label>Link expiration</Label>
            <RadioGroup 
              value={expiresIn?.toString() || 'never'} 
              onValueChange={(value) => setExpiresIn(value === 'never' ? null : parseInt(value))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="never" id="never" />
                <Label htmlFor="never">Never expires</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="7" id="7days" />
                <Label htmlFor="7days">7 days</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="30" id="30days" />
                <Label htmlFor="30days">30 days</Label>
              </div>
            </RadioGroup>
          </div>

          {shareToken && (
            <div className="space-y-2">
              <Label>Share link</Label>
              <div className="flex gap-2">
                <Input 
                  value={shareToken} 
                  readOnly 
                  className="bg-gray-800 border-gray-700"
                />
                <Button
                  onClick={() => navigator.clipboard.writeText(shareToken)}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={shareMethod === 'link' ? generateShareLink : shareViaEmail}
              disabled={loading || (shareMethod === 'email' && !email.trim())}
              className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600"
            >
              {loading ? 'Sharing...' : shareMethod === 'link' ? 'Generate Link' : 'Share Project'}
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
