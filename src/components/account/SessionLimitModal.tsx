import React, { useState } from "react";
import { AlertTriangle, Loader2, Shield, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AccountSession } from "@/hooks/useAccountSessions";

interface SessionLimitModalProps {
  open: boolean;
  activeCount: number;
  maxAllowed: number;
  sessions: AccountSession[];
  loading: boolean;
  error: string | null;
  onRevoke: (sessionId: string) => Promise<void>;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Unknown activity";
  const time = new Date(dateStr).getTime();
  if (Number.isNaN(time)) return "Unknown activity";

  const diffMs = Date.now() - time;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function SessionLimitModal({
  open,
  activeCount,
  maxAllowed,
  sessions,
  loading,
  error,
  onRevoke,
}: SessionLimitModalProps) {
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const revokableSessions = sessions.filter((session) => session.isActive && !session.isCurrent);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-xl"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="h-5 w-5" />
            Too many active devices
          </DialogTitle>
          <DialogDescription>
            Your account can be logged in on a maximum of {maxAllowed} devices. You currently have {activeCount} active sessions.
            Sign out at least one existing device to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-500" />
            Device sharing protection is enabled for your account.
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
          </div>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {revokableSessions.length === 0 ? (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                No other active sessions were found to revoke.
              </div>
            ) : (
              revokableSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {session.deviceLabel || "Browser session"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Active {formatRelativeTime(session.lastActiveAt)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={revokingId === session.id}
                    onClick={async () => {
                      try {
                        setRevokingId(session.id);
                        await onRevoke(session.id);
                      } finally {
                        setRevokingId(null);
                      }
                    }}
                  >
                    {revokingId === session.id ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Signing out...
                      </>
                    ) : (
                      <>
                        <Smartphone className="mr-2 h-3.5 w-3.5" />
                        Sign out device
                      </>
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
