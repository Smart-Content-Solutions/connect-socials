// src/components/InstagramConnectButton.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Instagram, CheckCircle2, LogOut, Building2, Plus, X } from "lucide-react";
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
import type { ConnectedAccount } from "./ConnectedAccountsSelector";

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
    "idle" | "select-business" | "select-page" | "connected" | "add-account"
  >("idle");

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [pages, setPages] = useState<PageWithIG[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [accountNickname, setAccountNickname] = useState("");
  const [pendingPage, setPendingPage] = useState<PageWithIG | null>(null);

  useEffect(() => {
    const stored = getInstagramAuthData();
    if (stored) {
      setAuthData(stored);
      // Check for new format first (array of accounts)
      const storedAccounts = localStorage.getItem("instagram_connected_pages");
      if (storedAccounts) {
        try {
          const accounts = JSON.parse(storedAccounts);
          if (Array.isArray(accounts) && accounts.length > 0) {
            setConnectedAccounts(accounts);
            setViewState("connected");
            return;
          }
        } catch (e) {
          console.error("Failed to parse stored accounts", e);
        }
      }
      
      // Backward compatibility: check for old format (single account)
      const storedSelection = localStorage.getItem("instagram_selected_page");
      if (storedSelection) {
        try {
          const singlePage = JSON.parse(storedSelection);
          // Migrate to new format
          const migratedAccounts: ConnectedAccount[] = [{
            id: singlePage.instagram_business_account?.id || singlePage.id,
            platform: "instagram",
            name: singlePage.name,
            access_token: stored.access_token || "",
            instagram_business_account_id: singlePage.instagram_business_account?.id,
          }];
          localStorage.setItem("instagram_connected_pages", JSON.stringify(migratedAccounts));
          localStorage.removeItem("instagram_selected_page"); // Clean up old key
          localStorage.removeItem("instagram_selected_id"); // Clean up old key
          setConnectedAccounts(migratedAccounts);
          setViewState("connected");
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
    // Instead of immediately saving, prompt for nickname
    setPendingPage(page);
    setAccountNickname("");
    setViewState("add-account");
  };

  const handleSaveAccountWithNickname = () => {
    if (!pendingPage || !authData?.access_token) return;

    const newAccount: ConnectedAccount = {
      id: pendingPage.instagram_business_account?.id || pendingPage.id,
      platform: "instagram",
      name: pendingPage.name,
      nickname: accountNickname.trim() || undefined,
      access_token: authData.access_token,
      instagram_business_account_id: pendingPage.instagram_business_account?.id,
    };

    const updatedAccounts = [...connectedAccounts, newAccount];
    setConnectedAccounts(updatedAccounts);
    localStorage.setItem("instagram_connected_pages", JSON.stringify(updatedAccounts));

    setPendingPage(null);
    setAccountNickname("");
    setViewState("connected");
    toast.success(`Connected to ${newAccount.nickname || newAccount.name}`);
  };

  const handleAddAnotherAccount = () => {
    // Reset to start the flow again
    setSelectedBusiness(null);
    setPendingPage(null);
    setAccountNickname("");
    if (authData?.access_token) {
      fetchBusinesses(authData.access_token);
    }
  };

  const handleRemoveAccount = (accountId: string) => {
    const updatedAccounts = connectedAccounts.filter((a) => a.id !== accountId);
    setConnectedAccounts(updatedAccounts);
    localStorage.setItem("instagram_connected_pages", JSON.stringify(updatedAccounts));
    
    if (updatedAccounts.length === 0) {
      // If no accounts left, go back to selection
      setViewState("select-business");
      if (authData?.access_token) {
        fetchBusinesses(authData.access_token);
      }
    }
    toast.success("Account removed");
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
    localStorage.removeItem("instagram_connected_pages");
    localStorage.removeItem("instagram_selected_page"); // Clean up old key
    localStorage.removeItem("instagram_selected_id"); // Clean up old key
    setAuthData(null);
    setViewState("idle");
    setSelectedBusiness(null);
    setConnectedAccounts([]);
    toast.success("Instagram disconnected");
  };

  if (viewState === "connected" && authData && connectedAccounts.length > 0) {
    return (
      <Card className="p-8 max-w-2xl mx-auto border-pink-200 bg-pink-50/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold">Instagram Connected</h2>
              <p className="text-sm text-muted-foreground">
                {connectedAccounts.length} account{connectedAccounts.length > 1 ? "s" : ""} connected
              </p>
            </div>

          </div>

          <Button variant="outline" onClick={handleDisconnect} className="gap-2">
            <LogOut className="h-4 w-4" />
            Disconnect All
          </Button>
        </div>

        <div className="flex items-center gap-4 p-6 bg-white border rounded-lg shadow-sm mb-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={authData.profilePicture || authData.picture || undefined} />
            <AvatarFallback className="bg-pink-600 text-white text-xl">
              {((authData.name || authData.username || "I").charAt(0)) ?? "I"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h3 className="text-lg font-semibold">{authData.name || authData.username || "Instagram User"}</h3>
            {selectedBusiness && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
                  <Building2 className="w-3 h-3" /> {selectedBusiness.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Connected Accounts List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Connected Accounts</h4>
          {connectedAccounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between p-4 bg-white border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="bg-pink-100 p-2 rounded-full">
                  <Instagram className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="font-medium">
                    {account.nickname || account.name}
                  </p>
                  {account.nickname && (
                    <p className="text-xs text-muted-foreground">{account.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground">ID: {account.id}</p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveAccount(account.id)}
                className="p-2 hover:bg-red-50 rounded-full transition-colors"
                title="Remove account"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Another Account Button */}
        <Button
          onClick={handleAddAnotherAccount}
          variant="outline"
          className="w-full mt-4 gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Another Account
        </Button>
      </Card>
    );
  }

  // Add Account with Nickname View
  if (viewState === "add-account" && pendingPage) {
    return (
      <Card className="p-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewState("select-page")}
            className="mb-4 pl-0"
          >
            ← Back
          </Button>
          <h2 className="text-2xl font-bold mb-2">Add Account Nickname (Optional)</h2>
          <p className="text-muted-foreground">
            Give this account a nickname to easily identify it when posting (e.g., "Business IG" or "Personal Account")
          </p>
        </div>

        <div className="flex items-center gap-4 p-6 bg-pink-50 border border-pink-200 rounded-lg mb-6">
          <div className="bg-pink-100 p-3 rounded-full">
            <Instagram className="w-6 h-6 text-pink-600" />
          </div>
          <div>
            <p className="font-semibold text-lg">{pendingPage.name}</p>
            <p className="text-sm text-muted-foreground">
              IG ID: {pendingPage.instagram_business_account?.id}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nickname <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={accountNickname}
              onChange={(e) => setAccountNickname(e.target.value)}
              placeholder="e.g., Business IG"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setViewState("select-page")}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAccountWithNickname}
              className="flex-1 bg-pink-600 text-white gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {accountNickname.trim() ? `Save as "${accountNickname.trim()}"` : `Save as "${pendingPage.name}"`}
            </Button>
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
            {businesses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No Business Managers found.
                <Button variant="link" onClick={() => fetchPagesWithoutBusiness(authData!.access_token)}>
                  Check for Instagram accounts directly
                </Button>
              </div>
            ) : (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Want to connect personal Instagram accounts?
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => fetchPagesWithoutBusiness(authData!.access_token)}
                    className="gap-2"
                  >
                    <Instagram className="w-4 h-4" />
                    Show Linked Instagram Accounts
                  </Button>
                </div>
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
