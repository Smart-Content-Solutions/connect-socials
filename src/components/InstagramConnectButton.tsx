// src/components/InstagramConnectButton.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Instagram, CheckCircle2, LogOut } from "lucide-react";
import {
  initiateInstagramAuth,
  getInstagramAuthData,
  isInstagramConnected,
  clearInstagramAuthData,
  type InstagramAuthData,
} from "@/utils/instagramOAuth";
import { toast } from "sonner";

export function InstagramConnectButton() {
  const [authData, setAuthData] = useState<InstagramAuthData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const stored = getInstagramAuthData();
    if (stored) setAuthData(stored);
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const clerkUser = (window as any).Clerk?.user;
      if (!clerkUser) {
        toast.error("You must be logged in to connect Instagram.");
        setIsLoading(false);
        return;
      }
      await initiateInstagramAuth();
      // redirect will occur
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Failed to start Instagram auth");
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    clearInstagramAuthData();
    setAuthData(null);
    toast.success("Instagram disconnected");
  };

  if (authData && isInstagramConnected()) {
    return (
      <Card className="p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <h2 className="text-2xl font-bold">Instagram Connected</h2>
          </div>

          <Button variant="outline" onClick={handleDisconnect} className="gap-2">
            <LogOut className="h-4 w-4" />
            Disconnect
          </Button>
        </div>

        <div className="flex items-center gap-4 p-6 bg-muted rounded-lg">
          <Avatar className="h-16 w-16">
            <AvatarImage src={authData.picture || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {((authData.name || authData.username || "I").charAt(0)) ?? "I"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h3 className="text-lg font-semibold">{authData.name || authData.username || "Instagram User"}</h3>
            <p className="text-sm text-muted-foreground">{authData.username ? `@${authData.username}` : ""}</p>

            <p className="text-xs text-muted-foreground mt-1">
              Instagram ID: {authData.instagram_user_id}
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Connected Pages (via Facebook)</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            {authData.pages && authData.pages.length > 0 ? (
              authData.pages.map((p) => <div key={p.id}>• {p.name}</div>)
            ) : (
              <div>No connected Facebook Pages / Instagram Business Accounts found.</div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8 max-w-2xl mx-auto text-center">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-50 mb-4">
          <Instagram className="h-8 w-8 text-pink-600" />
        </div>

        <h2 className="text-3xl font-bold mb-2">Connect Your Instagram</h2>
        <p className="text-muted-foreground">Enable posting to Instagram (Business accounts) and profile sync.</p>
      </div>

      <Button
        onClick={handleConnect}
        disabled={isLoading}
        size="lg"
        className="gap-2 text-lg px-8 py-6 bg-pink-600 text-white"
      >
        <Instagram className="h-6 w-6" />
        {isLoading ? "Connecting…" : "Connect Instagram"}
      </Button>
    </Card>
  );
}
