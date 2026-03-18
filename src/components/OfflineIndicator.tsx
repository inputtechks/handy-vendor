import { CloudOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { AnimatePresence, motion } from "framer-motion";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground text-center py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5"
        >
          <CloudOff className="h-3.5 w-3.5" />
          Offline — changes will sync when reconnected
        </motion.div>
      )}
    </AnimatePresence>
  );
}
