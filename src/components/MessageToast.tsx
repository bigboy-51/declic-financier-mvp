import { useEffect, useState } from "react";
import { X, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageToastProps {
  id: string;
  text: string;
  senderName: string;
  senderRole: "boss" | "wife";
  onDismiss: () => void;
  onNavigate: () => void;
}

const AUTO_DISMISS_MS = 3000;

export function MessageToast({ text, senderName, senderRole, onDismiss, onNavigate }: MessageToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = requestAnimationFrame(() => setVisible(true));
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, AUTO_DISMISS_MS);
    return () => {
      cancelAnimationFrame(showTimer);
      clearTimeout(hideTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isBoss = senderRole === "boss";

  const handleClick = () => {
    setVisible(false);
    setTimeout(onNavigate, 150);
  };

  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-sm",
        "transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none",
      )}
      data-testid="message-toast"
    >
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border-2 text-left",
          isBoss
            ? "bg-blue-50 dark:bg-blue-950/80 border-blue-400 text-blue-900 dark:text-blue-100"
            : "bg-pink-50 dark:bg-pink-950/80 border-pink-400 text-pink-900 dark:text-pink-100",
        )}
      >
        <div
          className={cn(
            "w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white font-black text-sm",
            isBoss ? "bg-blue-400" : "bg-pink-500",
          )}
        >
          {senderName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <MessageCircle className="w-3 h-3 opacity-70 flex-shrink-0" />
            <p className="text-xs font-bold opacity-80 truncate">{senderName}</p>
          </div>
          <p className="text-sm font-semibold leading-snug line-clamp-2">{text}</p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setVisible(false);
            setTimeout(onDismiss, 300);
          }}
          data-testid="button-dismiss-message-toast"
          className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </button>

      {/* Progress bar */}
      <div
        className={cn(
          "h-1 rounded-full mt-1 mx-2",
          isBoss ? "bg-blue-200 dark:bg-blue-800" : "bg-pink-200 dark:bg-pink-800",
        )}
      >
        <div
          className={cn(
            "h-full rounded-full origin-left",
            isBoss ? "bg-blue-400" : "bg-pink-500",
            visible ? "animate-shrink-bar" : "",
          )}
          style={{ animationDuration: `${AUTO_DISMISS_MS}ms` }}
        />
      </div>
    </div>
  );
}
