import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Check, X, Shield, Loader2 } from "lucide-react";

interface Profile {
  id: string;
  email: string | null;
  is_approved: boolean;
  created_at: string;
}

export default function AdminPage() {
  const { t } = useLanguage();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, email, is_approved, created_at")
      .order("created_at", { ascending: false });
    setProfiles((data as Profile[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const toggleApproval = async (profileId: string, approve: boolean) => {
    setUpdating(profileId);
    await supabase
      .from("profiles")
      .update({ is_approved: approve })
      .eq("id", profileId);
    setProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, is_approved: approve } : p))
    );
    setUpdating(null);
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-black tracking-tight text-foreground">Admin Panel</h1>
        </div>
        <LanguageToggle />
      </header>

      <p className="text-muted-foreground text-sm mb-6">
        Manage user accounts. Approve or revoke access.
      </p>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : profiles.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No users found.</p>
      ) : (
        <div className="space-y-3">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl bg-card border border-border p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground truncate">
                  {p.email ?? "No email"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    p.is_approved
                      ? "bg-cash/20 text-cash"
                      : "bg-destructive/20 text-destructive"
                  }`}
                >
                  {p.is_approved ? "Approved" : "Pending"}
                </span>
                {updating === p.id ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : p.is_approved ? (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => toggleApproval(p.id, false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => toggleApproval(p.id, true)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
