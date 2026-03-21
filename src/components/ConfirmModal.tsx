import { useEffect, useRef } from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
  confirmLabel?: string;
  type?: "delete" | "warning";
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isDeleting = false,
  confirmLabel,
  type = "delete",
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      cancelRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) return null;

  const isDelete = type === "delete";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={() => { if (!isDeleting) onCancel(); }}
        style={{ animation: "fadeIn 0.18s ease" }}
      />

      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        style={{ animation: "scaleIn 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}
        dir={t.dir}
      >
        <button
          onClick={onCancel}
          disabled={isDeleting}
          className="absolute top-4 left-4 p-1.5 rounded-xl text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-30"
        >
          <X className="w-4 h-4" />
        </button>

        <div className={`h-1.5 w-full ${isDelete ? "bg-gradient-to-l from-red-400 to-rose-600" : "bg-gradient-to-l from-amber-400 to-orange-500"}`} />

        <div className="p-7 pt-8 text-center">
          <div className="relative mx-auto mb-5 w-fit">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${isDelete ? "bg-red-50" : "bg-amber-50"}`}>
              {isDelete
                ? <Trash2 className="w-7 h-7 text-red-500" />
                : <AlertTriangle className="w-7 h-7 text-amber-500" />
              }
            </div>
            <span className={`absolute inset-0 rounded-2xl animate-ping opacity-20 ${isDelete ? "bg-red-400" : "bg-amber-400"}`} />
          </div>

          <h2 className="text-xl font-black text-slate-900 mb-2">{title}</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
        </div>

        <div className="h-px bg-slate-100 mx-6" />

        <div className="p-5 flex gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-40"
          >
            {t.confirm_cancel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg ${
              isDelete
                ? "bg-gradient-to-l from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-200"
                : "bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-200"
            }`}
          >
            {isDeleting ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
                {t.confirm_deleting}
              </>
            ) : (
              <>
                {isDelete && <Trash2 className="w-4 h-4" />}
                {confirmLabel || (isDelete ? t.confirm_delete_btn : t.confirm_ok)}
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.88) } to { opacity: 1; transform: scale(1) } }
      `}</style>
    </div>
  );
}
