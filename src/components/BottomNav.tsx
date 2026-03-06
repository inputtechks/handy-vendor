import { NavLink } from "react-router-dom";
import { Package, ShoppingCart, BarChart3, ArrowRightLeft } from "lucide-react";

export function BottomNav() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors touch-target ${
      isActive ? "text-primary" : "text-muted-foreground"
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        <NavLink to="/" className={linkClass}>
          <Package className="h-5 w-5" />
          <span className="text-[10px] font-bold">Inventory</span>
        </NavLink>
        <NavLink to="/sell" className={linkClass}>
          <ShoppingCart className="h-5 w-5" />
          <span className="text-[10px] font-bold">Sell</span>
        </NavLink>
        <NavLink to="/movements" className={linkClass}>
          <ArrowRightLeft className="h-5 w-5" />
          <span className="text-[10px] font-bold">Movements</span>
        </NavLink>
        <NavLink to="/dashboard" className={linkClass}>
          <BarChart3 className="h-5 w-5" />
          <span className="text-[10px] font-bold">Report</span>
        </NavLink>
      </div>
    </nav>
  );
}
