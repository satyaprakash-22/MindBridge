import { Link } from "react-router-dom";
import { Brain, Heart, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
                <Brain className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">MindBridge</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for Youngistaan Foundation. Bridging youth to support, one conversation at a time.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Platform</h4>
            <div className="flex flex-col gap-2">
              <Link to="/get-support" className="text-sm text-muted-foreground hover:text-primary">Get Support</Link>
              <Link to="/about" className="text-sm text-muted-foreground hover:text-primary">About Us</Link>
              <Link to="/mentor-login" className="text-sm text-muted-foreground hover:text-primary">Volunteer</Link>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Helplines</h4>
            <div className="flex flex-col gap-2">
              <a href="tel:9152987821" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive">
                <Phone className="h-3 w-3" /> iCall: 9152987821
              </a>
              <a href="tel:18602662345" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive">
                <Phone className="h-3 w-3" /> Vandrevala: 1860-2662-345
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Contact</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>Youngistaan Foundation</p>
              <p>India</p>
              <a href="mailto:support@mindbridge.org" className="hover:text-primary">support@mindbridge.org</a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 md:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MindBridge — Youngistaan Foundation. All rights reserved.
          </p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            Made with <Heart className="h-3 w-3 text-destructive" /> for young India
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
