
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Bot, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function AISiteIndexer() {
  const [formData, setFormData] = useState({
    wp_url: '',
    wp_username: '',
    wp_app_password: '',
    brand_voice: '',
    target_audience: '',
    preferred_style: 'Professional yet conversational'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSync = async () => {
    setIsLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('https://n8n.smartcontentsolutions.co.uk/webhook/scs-site-indexer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('success');
      } else {
        throw new Error('Failed to connect to AI Indexer');
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMessage('Failed to sync. Please check your inputs and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-card border-border border-l-4 border-l-gold shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-gold" />
          <CardTitle className="text-xl text-foreground">AI Site Integration</CardTitle>
        </div>
        <CardDescription>
          Connect your WordPress site and train the AI on your brand voice. This allows the Agent to write content that sounds exactly like you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Connection Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">WordPress Connection</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wp_url">WordPress URL</Label>
              <Input 
                id="wp_url" 
                name="wp_url" 
                placeholder="https://your-site.com" 
                value={formData.wp_url} 
                onChange={handleChange} 
                className="bg-background border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wp_username">Username</Label>
              <Input 
                id="wp_username" 
                name="wp_username" 
                placeholder="admin" 
                value={formData.wp_username} 
                onChange={handleChange}
                className="bg-background border-input"
              />
            </div>
            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label htmlFor="wp_app_password">Application Password</Label>
              <Input 
                id="wp_app_password" 
                name="wp_app_password" 
                type="password"
                placeholder="abcd efgh ijkl mnop" 
                value={formData.wp_app_password} 
                onChange={handleChange}
                className="bg-background border-input font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Go to Users → Profile → Application Passwords in WordPress to generate this.
              </p>
            </div>
          </div>
        </div>

        {/* AI Personality */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">AI Personality</h3>
          
          <div className="space-y-2">
            <Label htmlFor="brand_voice">Brand Voice</Label>
            <Textarea 
              id="brand_voice" 
              name="brand_voice" 
              placeholder="e.g. Professional, witty, authoritative. Use British spelling." 
              value={formData.brand_voice} 
              onChange={handleChange}
              className="bg-background border-input min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_audience">Target Audience</Label>
            <Textarea 
              id="target_audience" 
              name="target_audience" 
              placeholder="e.g. Small business owners in London looking for SEO services." 
              value={formData.target_audience} 
              onChange={handleChange}
              className="bg-background border-input min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_style">Preferred Writing Style</Label>
            <Input 
              id="preferred_style" 
              name="preferred_style" 
              placeholder="e.g. Professional yet conversational" 
              value={formData.preferred_style} 
              onChange={handleChange}
              className="bg-background border-input"
            />
          </div>
        </div>

        {/* Status Messages */}
        {status === 'success' && (
          <Alert className="bg-green-500/10 border-green-500 text-green-500">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
              Your site is being indexed. The AI is now learning your content and brand voice.
            </AlertDescription>
          </Alert>
        )}

        {status === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Action Button */}
        <Button 
          onClick={handleSync} 
          disabled={isLoading} 
          className="w-full bg-gold hover:bg-gold/90 text-black font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing & Training...
            </>
          ) : (
            'Sync Site & Train AI Agent'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
