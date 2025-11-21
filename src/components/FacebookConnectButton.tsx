// src/components/FacebookConnectButton.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Facebook, CheckCircle2, LogOut } from "lucide-react";
import {
  initiateFacebookAuth,
  getFacebookAuthData,
  isFacebookConnected,
  clearFacebookAuthData,
  type FacebookAuthData
} from "@/utils/facebookOAuth";
import { toast } from "sonner";
import { useAuth } from "@clerk/clerk-react";

export function FacebookConnectButton() {
  const [authData, setAuthData] = useState<FacebookAuthData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Clerk user
  const { userId, isLoaded } = useAuth();

  useEffect(() => {
    const stored = getFacebookAuthData();
    if (stored) setAuthData(stored);
  }, []);

  const handleConnect = async () => {
    if (!isLoaded) return;
    if (!userId) {
      toast.error("You must be logged in to connect Facebook.");
      return;
    }

    setIsLoading(true);
    try {
      // PASS CLERK USER ID (CRITICAL FIX)
      initiateFacebookAuth(userId);
      // Redirect happens instantly
    } catch (err) {
      console.error(err);
      toast.error("Failed to start Facebook auth");
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    clearFacebookAuthData();
    setAuthData(null);
    toast.success("Facebook disconnected");
  };

  // Already connected UI
  if (authData && isFacebookConnected()) {
    return (
      <Card className="p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <h2 className="text-2xl font-bold">Facebook Connected</h2>
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
              {authData.name?.charAt(0) ?? "F"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h3 className="text-lg font-semibold">{authData.name || "Facebook User"}</h3>
            <p className="text-sm text-muted-foreground">{authData.email || ""}</p>

            <p className="text-xs text-muted-foreground mt-1">
              Facebook ID: {authData.facebook_user_id}
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Pages</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            {authData.pages && authData.pages.length > 0 ? (
              authData.pages.map((p) => (
                <div key={p.id}>• {p.name}</div>
              ))
            ) : (
              <div>No pages found.</div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Not connected UI
  return (
    <Card className="p-8 max-w-2xl mx-auto text-center">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
          <Facebook className="h-8 w-8 text-blue-600" />
        </div>

        <h2 className="text-3xl font-bold mb-2">Connect Your Facebook</h2>
        <p className="text-muted-foreground">
          Enable posting to Facebook Pages and sync your profile info.
        </p>
      </div>

      <Button
        onClick={handleConnect}
        disabled={isLoading || !isLoaded}
        size="lg"
        className="gap-2 text-lg px-8 py-6 bg-blue-600 text-white"
      >
        <Facebook className="h-6 w-6" />
        {isLoading ? "Connecting…" : "Connect Facebook"}
      </Button>
    </Card>
  );
}
