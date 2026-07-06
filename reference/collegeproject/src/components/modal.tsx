import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

export function Modal({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-card rounded-xl ring-1 ring-black/10 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button onClick={onClose} className="size-7 grid place-items-center rounded-md text-muted-foreground hover:bg-secondary"><X className="size-4" /></button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-border flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
