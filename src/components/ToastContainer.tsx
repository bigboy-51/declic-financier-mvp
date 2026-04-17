import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface Toast {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
}

interface ToastContainerProps {
  toasts: Toast[];
  dismiss?: (id: string) => void;
}

export function ToastContainer({ toasts, dismiss }: ToastContainerProps) {
  const [visibleToasts, setVisibleToasts] = useState<Set<string>>(new Set());

  useEffect(() => {
    toasts.forEach((toast) => {
      setVisibleToasts((prev) => new Set(prev).add(toast.id));

      const timer = setTimeout(() => {
        setVisibleToasts((prev) => {
          const next = new Set(prev);
          next.delete(toast.id);
          return next;
        });
        dismiss?.(toast.id);
      }, 5000);

      return () => clearTimeout(timer);
    });
  }, [toasts, dismiss]);

  const handleClose = (id: string) => {
    setVisibleToasts((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    dismiss?.(id);
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts
        .filter((t) => visibleToasts.has(t.id))
        .map((toast) => (
          <div
            key={toast.id}
            className="bg-card border border-success/30 rounded-lg px-4 py-3 shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-auto max-w-sm"
          >
            <span className="text-xl text-success">✓</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{toast.title}</p>
              {toast.description && (
                <p className="text-xs text-muted-foreground">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => handleClose(toast.id)}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1"
              data-testid="button-close-toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
    </div>
  );
}
