import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { path: "/", label: "Home" },
  { path: "/ebay", label: "eBay" },
  { path: "/bestbuy", label: "BestBuy" },
  { path: "/compare", label: "Compare" },
];

const Navigation = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-5 h-5 shrink-0 text-primary" />
            <span className="text-lg font-bold text-foreground truncate">AI Review Analyzer</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === link.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile nav */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="md:hidden p-2 rounded-md text-foreground hover:bg-muted transition-colors shrink-0"
              >
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 bg-background border-border">
              <div className="flex flex-col gap-1 mt-10">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "px-4 py-3 rounded-md text-base font-medium transition-colors",
                      location.pathname === link.path
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
