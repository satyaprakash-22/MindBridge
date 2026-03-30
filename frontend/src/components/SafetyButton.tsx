import { useState } from "react";
import { Phone, X } from "lucide-react";

const SafetyButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-destructive shadow-lg transition-transform hover:scale-110"
        aria-label="Need Help Now?"
      >
        <Phone className="h-6 w-6 text-destructive-foreground" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/50 p-4" onClick={() => setIsOpen(false)}>
          <div
            className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Need Help Now?</h3>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              If you or someone you know is in crisis, please reach out to these helplines immediately. They are free and confidential.
            </p>
            <div className="space-y-3">
              <a
                href="tel:9152987821"
                className="flex items-center gap-3 rounded-2xl bg-destructive/10 p-4 transition-colors hover:bg-destructive/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive">
                  <Phone className="h-4 w-4 text-destructive-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">iCall (TISS)</p>
                  <p className="text-sm text-muted-foreground">9152987821</p>
                  <p className="text-xs text-muted-foreground">Mon–Sat, 8am–10pm</p>
                </div>
              </a>
              <a
                href="tel:18602662345"
                className="flex items-center gap-3 rounded-2xl bg-destructive/10 p-4 transition-colors hover:bg-destructive/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive">
                  <Phone className="h-4 w-4 text-destructive-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Vandrevala Foundation</p>
                  <p className="text-sm text-muted-foreground">1860-2662-345</p>
                  <p className="text-xs text-muted-foreground">24/7, All days</p>
                </div>
              </a>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              You are not alone. Help is always available. 💙
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default SafetyButton;
