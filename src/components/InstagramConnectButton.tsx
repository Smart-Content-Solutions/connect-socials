// src/components/InstagramConnectButton.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Instagram, CheckCircle2, LogOut, Building2 } from "lucide-react";
import {
  initiateInstagramAuth,
  getInstagramAuthData,
  isInstagramConnected,
  clearInstagramAuthData,
  saveInstagramAuthData,
  type InstagramAuthData,
} from "@/utils/instagramOAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Business {
  id: string;
  name: string;
}

interface PageWithIG {
  id: string;
  name: string;
  instagram_business_account?: {
    id: string;
  };
}

export function InstagramConnectButton() {
  const [authData, setAuthData] = useState<InstagramAuthData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewState, setViewState] = useState<
    "idle" | "select-business" | "select-page" | "connected"
  >("idle");

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [pages, setPages] = useState<PageWithIG[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null
  );
  // We store the selected "Page" here but essentially we are selecting the IG account on it
  const [selectedPage, setSelectedPage] = useState<PageWithIG | null>(null);

  useEffect(() => {
    const stored = getInstagramAuthData();
    if (stored) {
      setAuthData(stored);
      // Check if wizard completed
      const storedSelection = localStorage.getItem("instagram_selected_page");
      if (storedSelection) {
        setViewState("connected");
        try {
          setSelectedPage(JSON.parse(storedSelection));
        } catch (e) {
          console.error(e);
        }
      } else {
        // Start wizard
        if (stored.access_token) {
          fetchBusinesses(stored.access_token);
        }
      }
    }
  }, []);

  const fetchBusinesses = async (token: string) => {
    setViewState("select-business");
    setIsLoading(true);
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/me/businesses?access_token=${token}`
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      const bizList = data.data || [];
      setBusinesses(bizList);

      if (bizList.length === 0) {
        toast.info("No Business Managers found. Checking for direct Pages...");
        fetchPagesWithoutBusiness(token);
      }
    } catch (err: any) {
      console.error("Error fetching businesses:", err);
      toast.error("Failed to load Business Managers.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPagesWithoutBusiness = async (token: string) => {
    setIsLoading(true);
    setViewState("select-page");
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?fields=name,instagram_business_account&access_token=${token}`
      );
      const data = await res.json();
      if (data.data) {
        // Filter only pages with IG
        const valid = data.data.filter((p: any) => p.instagram_business_account);
        setPages(valid);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSelectBusiness = async (biz: Business) => {
    setSelectedBusiness(biz);
    setViewState("select-page");
    setIsLoading(true);

    if (!authData?.access_token) return;

    try {
      // Fetch pages for this business, requesting IG account field
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${biz.id}/client_pages?fields=name,instagram_business_account&access_token=${authData.access_token}`
      );
      const data = await res.json();

      let pageList = [];
      if (data.error) {
        // Try owned_pages fallback
        const res2 = await fetch(
          `https://graph.facebook.com/v19.0/${biz.id}/owned_pages?fields=name,instagram_business_account&access_token=${authData.access_token}`
        );
        const data2 = await res2.json();
        pageList = data2.data || [];
      } else {
        pageList = data.data || [];
      }

      // Filter: Must have instagram_business_account
      const validPages = pageList.filter((p: any) => p.instagram_business_account);
      setPages(validPages);

    } catch (err: any) {
      console.error("Error fetching pages:", err);
      toast.error("Failed to load Instagram accounts.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPage = (page: PageWithIG) => {
    setSelectedPage(page);
    localStorage.setItem("instagram_selected_page", JSON.stringify(page));

    // Also store the IG ID specifically if needed for other utils
    if (page.instagram_business_account?.id) {
      localStorage.setItem("instagram_selected_id", page.instagram_business_account.id);
    }

    setViewState("connected");
    toast.success(`Connected to Instagram via ${page.name}`);
  };

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
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Failed to start Instagram auth");
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    clearInstagramAuthData();
    localStorage.removeItem("instagram_selected_page");
    localStorage.removeItem("instagram_selected_id");
    setAuthData(null);
    setViewState("idle");
    setSelectedBusiness(null);
    setSelectedPage(null);
    toast.success("Instagram disconnected");
  };

  if (viewState === "connected" && authData) {
    return (
      <Card className="p-8 max-w-2xl mx-auto border-pink-200 bg-pink-50/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold">Instagram Connected</h2>
              <p className="text-sm text-muted-foreground">Ready to post</p>
            </div>

          </div>

          <Button variant="outline" onClick={handleDisconnect} className="gap-2">
            <LogOut className="h-4 w-4" />
            Disconnect
          </Button>
        </div>

        <div className="flex items-center gap-4 p-6 bg-white border rounded-lg shadow-sm">
          <Avatar className="h-16 w-16">
            <AvatarImage src={authData.profilePicture || authData.picture || undefined} />
            <AvatarFallback className="bg-pink-600 text-white text-xl">
              {((authData.name || authData.username || "I").charAt(0)) ?? "I"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h3 className="text-lg font-semibold">{authData.name || authData.username || "Instagram User"}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              {selectedBusiness && (
                <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
                  <Building2 className="w-3 h-3" /> {selectedBusiness.name}
                </span>
              )}
            </div>
            {selectedPage && (
              <p className="text-xs text-muted-foreground mt-2">
                Linked Page: {selectedPage.name} <br />
                IG Business ID: {selectedPage.instagram_business_account?.id}
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (viewState === "select-business") {
    return (
      <Card className="p-8 max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Select a Business</h2>
          <p className="text-muted-foreground">
            Select the Business Manager that owns your Instagram account.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {businesses.map((biz) => (
              <div
                key={biz.id}
                onClick={() => handleSelectBusiness(biz)}
                className="flex items-center p-4 border rounded-lg hover:bg-pink-50 hover:border-pink-200 cursor-pointer transition-all group"
              >
                <div className="bg-gray-100 p-3 rounded-full mr-4 group-hover:bg-pink-200 transition-colors">
                  <Building2 className="w-6 h-6 text-gray-600 group-hover:text-pink-700" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{biz.name}</h3>
                  <p className="text-xs text-muted-foreground">ID: {biz.id}</p>
                </div>
                <Button variant="ghost" size="sm">Select</Button>
              </div>
            ))}
            {businesses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No Business Managers found.
                <Button variant="link" onClick={() => fetchPagesWithoutBusiness(authData!.access_token)}>
                  Check for Instagram accounts directly
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    );
  }

  if (viewState === "select-page") {
    return (
      <Card className="p-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewState(selectedBusiness ? "select-business" : "idle")}
            className="mb-4 pl-0"
          >
            ← Back
          </Button>
          <h2 className="text-2xl font-bold mb-2">Select Instagram Account</h2>
          <p className="text-muted-foreground">
            {selectedBusiness
              ? `Showing Instagram Business Accounts under "${selectedBusiness.name}"`
              : "Select an Instagram Business Account"}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {pages.map((p) => (
              <div
                key={p.id}
                onClick={() => handleSelectPage(p)}
                className="flex items-center p-4 border rounded-lg hover:bg-pink-50 hover:border-pink-200 cursor-pointer transition-all group"
              >
                <div className="bg-pink-100 p-3 rounded-full mr-4 group-hover:bg-pink-200 transition-colors">
                  <Instagram className="w-6 h-6 text-pink-600 group-hover:text-pink-700" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    IG ID: {p.instagram_business_account?.id}
                  </p>
                </div>
                <Button variant="ghost" size="sm">Connect</Button>
              </div>
            ))}

            {pages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No Instagram Business Accounts found in this Business Manager.
                <br />(Make sure your Instagram account is switched to Business/Creator mode and linked to a Facebook Page)
              </div>
            )}
          </div>
        )}
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

      <p className="text-xs text-muted-foreground mt-4 max-w-sm mx-auto">
        Requires 'business_management' permission to identifiy your Business settings and associated Instagram Accounts.
      </p>
    </Card>
  );
}
