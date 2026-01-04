import { Link } from "react-router-dom";
import { Recycle, Github, Linkedin, Mail, Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="relative mt-auto border-t border-border/50 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-900/30 dark:border-slate-700/50">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Recycle className="h-7 w-7 text-primary" />
              <span className="text-lg font-bold text-gradient-eco">EcoAR Recycling</span>
            </Link>
            <p className="text-sm text-muted-foreground dark:text-slate-400 mb-4">
              Recycle Smarter. Earn Rewards. Save the Planet.
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted/50 dark:bg-slate-700/50 hover:bg-primary/10 hover:text-primary dark:text-slate-300 dark:hover:text-emerald-400 transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted/50 dark:bg-slate-700/50 hover:bg-primary/10 hover:text-primary dark:text-slate-300 dark:hover:text-emerald-400 transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="mailto:contact@ecoar.app"
                className="p-2 rounded-lg bg-muted/50 dark:bg-slate-700/50 hover:bg-primary/10 hover:text-primary dark:text-slate-300 dark:hover:text-emerald-400 transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground dark:text-white">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { name: "Home", path: "/" },
                { name: "Scan Waste", path: "/scan" },
                { name: "Locate Bins", path: "/locate" },
                { name: "Leaderboard", path: "/leaderboard" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground dark:text-slate-400 hover:text-primary dark:hover:text-emerald-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground dark:text-white">About</h3>
            <ul className="space-y-2">
              <li>
                <Link to="#" className="text-sm text-muted-foreground dark:text-slate-400 hover:text-primary dark:hover:text-emerald-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="#" className="text-sm text-muted-foreground dark:text-slate-400 hover:text-primary dark:hover:text-emerald-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="#" className="text-sm text-muted-foreground dark:text-slate-400 hover:text-primary dark:hover:text-emerald-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="#" className="text-sm text-muted-foreground dark:text-slate-400 hover:text-primary dark:hover:text-emerald-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Hackathon Credit */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground dark:text-white">Hackathon Project</h3>
            <p className="text-sm text-muted-foreground dark:text-slate-400 mb-3">
              Built for sustainability and gamified waste sorting using WebAR and AI technology.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 dark:bg-emerald-500/20 text-primary dark:text-emerald-400 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Eco Hackathon 2026
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-border/50 dark:border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground dark:text-slate-400">
            © 2026 EcoAR Recycling. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground dark:text-slate-400 flex items-center gap-1">
            Made with <Heart className="h-4 w-4 text-destructive fill-destructive" /> for the planet
          </p>
        </div>
      </div>
    </footer>
  );
};
