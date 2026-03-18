import { NavLink } from "react-router-dom";
import { Package, ShoppingCart, BarChart3, ArrowRightLeft, Shield, LogOut } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

export function BottomNav() {
  const { t } = useLanguage();
  const { isAdmin, signOut } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors touch-target ${
      isActive ? "text-primary" : "text-muted-foreground"
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        <NavLink to="/dashboard" end className={linkClass}>
          <Package className="h-5 w-5" />
          <span className="text-[10px] font-bold">{t("nav.inventory")}</span>
        </NavLink>
        <NavLink to="/dashboard/sell" className={linkClass}>
          <ShoppingCart className="h-5 w-5" />
          <span className="text-[10px] font-bold">{t("nav.sell")}</span>
        </NavLink>
        <NavLink to="/dashboard/movements" className={linkClass}>
          <ArrowRightLeft className="h-5 w-5" />
          <span className="text-[10px] font-bold">{t("nav.movements")}</span>
        </NavLink>
        <NavLink to="/dashboard/report" className={linkClass}>
          <BarChart3 className="h-5 w-5" />
          <span className="text-[10px] font-bold">{t("nav.report")}</span>
        </NavLink>
        <NavLink to="/dashboard/reports" className={linkClass}>
          <FileText className="h-5 w-5" />
          <span className="text-[10px] font-bold">{t("nav.reports")}</span>
        </NavLink>
        {isAdmin && (
          <NavLink to="/dashboard/admin" className={linkClass}>
            <Shield className="h-5 w-5" />
            <span className="text-[10px] font-bold">Admin</span>
          </NavLink>
        )}
        <button
          onClick={() => void signOut()}
          className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors touch-target text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] font-bold">{t("nav.logout") ?? "Logout"}</span>
        </button>
      </div>
    </nav>
  );
}
