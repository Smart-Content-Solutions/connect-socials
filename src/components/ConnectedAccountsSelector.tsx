// src/components/ConnectedAccountsSelector.tsx
import { useState, useMemo } from "react";
import { Facebook, Instagram, Check, Square, SquareCheck, X } from "lucide-react";

export interface ConnectedAccount {
  id: string;
  platform: "facebook" | "instagram";
  name: string;
  nickname?: string;
  access_token: string;
  instagram_business_account_id?: string;
}

interface ConnectedAccountsSelectorProps {
  accounts: ConnectedAccount[];
  selectedIds: string[];
  onToggle: (id: string, platform: "facebook" | "instagram") => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function ConnectedAccountsSelector({
  accounts,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: ConnectedAccountsSelectorProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "facebook" | "instagram">("all");

  const filteredAccounts = useMemo(() => {
    if (activeFilter === "all") return accounts;
    return accounts.filter((acc) => acc.platform === activeFilter);
  }, [accounts, activeFilter]);

  const facebookCount = accounts.filter((a) => a.platform === "facebook").length;
  const instagramCount = accounts.filter((a) => a.platform === "instagram").length;
  const selectedCount = selectedIds.length;

  if (accounts.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-[#3B3C3E]/30 backdrop-blur-[20px] border border-white/5">
        <p className="text-[#A9AAAC] text-sm text-center">
          No connected accounts found. Connect Facebook or Instagram accounts first.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-[#3B3C3E]/30 backdrop-blur-[20px] border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[#D6D7D8]">
            Select Accounts
            <span className="text-[#5B5C60] font-normal ml-2">
              ({selectedCount} of {accounts.length} selected)
            </span>
          </h3>
          <p className="text-xs text-[#A9AAAC] mt-1">
            Choose which accounts to post to
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSelectAll}
            className="px-3 py-1.5 text-xs font-medium text-[#E1C37A] bg-[#E1C37A]/10 border border-[#E1C37A]/30 rounded-lg hover:bg-[#E1C37A]/20 transition-colors"
          >
            Select All
          </button>
          <button
            onClick={onDeselectAll}
            className="px-3 py-1.5 text-xs font-medium text-[#A9AAAC] bg-[#3B3C3E]/50 border border-white/10 rounded-lg hover:bg-[#3B3C3E] transition-colors"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Platform Filter Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setActiveFilter("all")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${activeFilter === "all"
            ? "bg-[#E1C37A]/20 text-[#E1C37A]"
            : "bg-[#3B3C3E]/50 text-[#A9AAAC] hover:text-[#D6D7D8]"
            }`}
        >
          All ({accounts.length})
        </button>
        {facebookCount > 0 && (
          <button
            onClick={() => setActiveFilter("facebook")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${activeFilter === "facebook"
              ? "bg-[#1877F2]/20 text-[#1877F2]"
              : "bg-[#3B3C3E]/50 text-[#A9AAAC] hover:text-[#D6D7D8]"
              }`}
          >
            <Facebook className="w-3 h-3" />
            Facebook ({facebookCount})
          </button>
        )}
        {instagramCount > 0 && (
          <button
            onClick={() => setActiveFilter("instagram")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${activeFilter === "instagram"
              ? "bg-[#E4405F]/20 text-[#E4405F]"
              : "bg-[#3B3C3E]/50 text-[#A9AAAC] hover:text-[#D6D7D8]"
              }`}
          >
            <Instagram className="w-3 h-3" />
            Instagram ({instagramCount})
          </button>
        )}
      </div>

      {/* Accounts Toggle List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {filteredAccounts.map((account) => {
          const isSelected = selectedIds.includes(account.id);
          const Icon = account.platform === "facebook" ? Facebook : Instagram;
          const color = account.platform === "facebook" ? "#1877F2" : "#E4405F";

          return (
            <button
              key={account.id}
              onClick={() => onToggle(account.id, account.platform)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${isSelected
                ? "bg-[#E1C37A]/10 border-[#E1C37A]/30"
                : "bg-[#2C2C2E]/50 border-white/5 hover:border-white/10"
                }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-[#D6D7D8]">
                    {account.nickname || account.name}
                  </p>
                  {account.nickname && (
                    <p className="text-xs text-[#5B5C60]">{account.name}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${color}20`,
                    color: color,
                  }}
                >
                  {account.platform === "facebook" ? "Page" : "Account"}
                </span>
                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-[#E1C37A] flex items-center justify-center">
                    <Check className="w-4 h-4 text-[#1A1A1C]" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-[#5B5C60]" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {filteredAccounts.length === 0 && (
        <p className="text-center text-[#5B5C60] text-sm py-4">
          No accounts found for this filter.
        </p>
      )}
    </div>
  );
}

export default ConnectedAccountsSelector;
