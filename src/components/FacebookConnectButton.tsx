// src/components/FacebookConnectButton.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Facebook, CheckCircle2, LogOut, Building2, Flag } from "lucide-react";
import {
  initiateFacebookAuth,
  getFacebookAuthData,
  isFacebookConnected,
  clearFacebookAuthData,
  saveFacebookAuthData,
  type FacebookAuthData,
  type FacebookPage,
} from "@/utils/facebookOAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Business {
  id: string;
  name: string;
}

export function FacebookConnectButton() {
  const [authData, setAuthData] = useState<FacebookAuthData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewState, setViewState] = useState<
    "idle" | "select-business" | "select-page" | "connected"
  >("idle");

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null
  );
  const [selectedPage, setSelectedPage] = useState<FacebookPage | null>(null);

  // Initialize state from storage
  useEffect(() => {
    const data = getFacebookAuthData();
    if (data) {
      setAuthData(data);
      // Check if we have partially completed the flow or fully connected
      const storedPage = localStorage.getItem("facebook_selected_page");
      if (storedPage) {
        setViewState("connected");
        try {
          setSelectedPage(JSON.parse(storedPage));
        } catch (e) {
          console.error("Failed to parse stored page", e);
        }
      } else {
        // Connected to FB but haven't selected business/page yet
        // Start the wizard flow
        fetchBusinesses(data.access_token);
      }
    }
  }, []);

  const fetchBusinesses = async (token: string) => {
    setViewState("select-business");
    setIsLoading(true);
    try {
      // META REQUIREMENT: Show list of Businesses user manages
      // GET /me/businesses
      const res = await fetch(
        `https://graph.facebook.com/v19.0/me/businesses?access_token=${token}`
      );
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const bizList = data.data || [];
      setBusinesses(bizList);

      // If no businesses found, we might need to fallback to just showing pages 
      // directly (if user is admin of pages directly but no business manager)
      // But for this specific requirement, we must show the list if it exists.
      if (bizList.length === 0) {
        toast.info("No Business Managers found. Falling back to direct Page access.");
        fetchPagesWithoutBusiness(token);
      }
    } catch (err: any) {
      console.error("Error fetching businesses:", err);
      toast.error("Failed to load Business Managers. " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPagesWithoutBusiness = async (token: string) => {
    // Fallback: Fetch all pages directly if no business found
    setIsLoading(true);
    setViewState("select-page");
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`
      );
      const data = await res.json();
      if (data.data) {
        setPages(data.data);
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
      // META REQUIREMENT: Show Pages under that Business
      // GET /{business-id}/client_pages
      // Note: owned_pages vs client_pages depends on permission. 
      // client_pages usually covers pages granted to the business.
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${biz.id}/client_pages?access_token=${authData.access_token}`
      );
      const data = await res.json();

      if (data.error) {
        // Try owned_pages as fallback
        const res2 = await fetch(
          `https://graph.facebook.com/v19.0/${biz.id}/owned_pages?access_token=${authData.access_token}`
        );
        const data2 = await res2.json();
        if (data2.error) throw new Error(data.error.message);
        setPages(data2.data || []);
      } else {
        setPages(data.data || []);
      }
    } catch (err: any) {
      console.error("Error fetching pages:", err);
      toast.error("Failed to load Pages. " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPage = (page: FacebookPage) => {
    setSelectedPage(page);

    // Save selected page persistently
    localStorage.setItem("facebook_selected_page", JSON.stringify(page));

    // Also update authData to include this page prominently if we want
    // But for now, we just move to connected state
    setViewState("connected");
    toast.success(`Connected to ${page.name}`);
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const clerkUser = (window as any).Clerk?.user;
      if (!clerkUser) {
        toast.error("You must be logged in to connect Facebook.");
        setIsLoading(false);
        return;
      }
      await initiateFacebookAuth();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Failed to start Facebook auth");
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    clearFacebookAuthData();
    setAuthData(null);
    setViewState("idle");
    setSelectedBusiness(null);
    setSelectedPage(null);
    toast.success("Facebook disconnected");
  };

  // --- RENDER HELPERS ---

  if (viewState === "connected" && authData && selectedPage) {
    return (
      <Card className="p-8 max-w-2xl mx-auto border-green-200 bg-green-50/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold">Facebook Connected</h2>
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
            <AvatarImage src={authData.picture || undefined} />
            <AvatarFallback className="bg-blue-600 text-white text-xl">
              {authData.name?.charAt(0) ?? "F"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h3 className="text-lg font-semibold">{authData.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              {selectedBusiness && (
                <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
                  <Building2 className="w-3 h-3" /> {selectedBusiness.name}
                </span>
              )}
              <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                <Flag className="w-3 h-3" /> {selectedPage.name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Page ID: {selectedPage.id}
            </p>
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
            We found the following Business Managers associated with your account.
            Please select the one that owns the Page you want to manage.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {businesses.map((biz) => (
              <div
                key={biz.id}
                onClick={() => handleSelectBusiness(biz)}
                className="flex items-center p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all group"
              >
                <div className="bg-gray-100 p-3 rounded-full mr-4 group-hover:bg-blue-200 transition-colors">
                  <Building2 className="w-6 h-6 text-gray-600 group-hover:text-blue-700" />
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
                  Click here to load Pages directly
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
          <h2 className="text-2xl font-bold mb-2">Select a Page</h2>
          <p className="text-muted-foreground">
            {selectedBusiness
              ? `Showing Pages for "${selectedBusiness.name}"`
              : "Select the Facebook Page you want to connect."}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {pages.map((page) => (
              <div
                key={page.id}
                onClick={() => handleSelectPage(page)}
                className="flex items-center p-4 border rounded-lg hover:bg-green-50 hover:border-green-200 cursor-pointer transition-all group"
              >
                <div className="bg-blue-100 p-3 rounded-full mr-4 group-hover:bg-green-200 transition-colors">
                  <Flag className="w-6 h-6 text-blue-600 group-hover:text-green-700" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{page.name}</h3>
                  <p className="text-xs text-muted-foreground">Page ID: {page.id}</p>
                </div>
                <Button variant="ghost" size="sm">Connect</Button>
              </div>
            ))}

            {pages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No Pages found for this Business.
              </div>
            )}
          </div>
        )}
      </Card>
    );
  }

  // Idle / Connect View
  return (
    <Card className="p-8 max-w-2xl mx-auto text-center">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
          <Facebook className="h-8 w-8 text-blue-600" />
        </div>

        <h2 className="text-3xl font-bold mb-2">Connect Your Facebook</h2>
        <p className="text-muted-foreground">
          Connect your Meta Business Manager to enable automated posting.
        </p>
      </div>

      <Button
        onClick={handleConnect}
        disabled={isLoading}
        size="lg"
        className="gap-2 text-lg px-8 py-6 bg-blue-600 text-white"
      >
        <Facebook className="h-6 w-6" />
        {isLoading ? "Connecting..." : "Connect Business Manager"}
      </Button>

      <p className="text-xs text-muted-foreground mt-4 max-w-sm mx-auto">
        Requires 'business_management' permission to identify your Business settings and associated Pages.
      </p>
    </Card>
  );
}
