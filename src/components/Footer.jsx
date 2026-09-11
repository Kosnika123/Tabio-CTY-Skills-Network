import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2">
              <Logo variant="dark" />
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              A platform where emerging talent turns skills, creativity and ideas
              into real opportunities.
            </p>

            <div className="mt-6 flex gap-2">
              {/* Instagram */}
              <a
                href="#"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 text-slate-400 transition hover:border-navy-500 hover:bg-navy-600 hover:text-white"
              >
                <svg
                  className="h-[17px] w-[17px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>

              {/* Twitter / X */}
              <a
                href="#"
                aria-label="Twitter"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 text-slate-400 transition hover:border-navy-500 hover:bg-navy-600 hover:text-white"
              >
                <svg
                  className="h-[17px] w-[17px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="#"
                aria-label="LinkedIn"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 text-slate-400 transition hover:border-navy-500 hover:bg-navy-600 hover:text-white"
              >
                <svg
                  className="h-[17px] w-[17px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>

              {/* GitHub */}
              <a
                href="#"
                aria-label="GitHub"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 text-slate-400 transition hover:border-navy-500 hover:bg-navy-600 hover:text-white"
              >
                <svg
                  className="h-[17px] w-[17px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold">Platform</h3>
            <div className="mt-5 flex flex-col gap-3">
              <Link
                to="/talent"
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Discover Talent
              </Link>
              <Link
                to="/projects"
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Explore Projects
              </Link>
              <Link
                to="/jobs"
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Opportunities
              </Link>
            </div>
          </div>

          {/* Talent */}
          <div>
            <h3 className="text-sm font-semibold">For Talent</h3>
            <div className="mt-5 flex flex-col gap-3">
              <Link
                to="/register"
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Create Profile
              </Link>
              <Link
                to="/jobs"
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Find Work
              </Link>
              <Link
                to="/projects"
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Showcase Work
              </Link>
            </div>
          </div>

          {/* Businesses */}
          <div>
            <h3 className="text-sm font-semibold">For Businesses</h3>
            <div className="mt-5 flex flex-col gap-3">
              <Link
                to="/talent"
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Find Talent
              </Link>
              <Link
                to="/register"
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Create Business Account
              </Link>
              <Link
                to="/jobs"
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Post an Opportunity
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col justify-between gap-4 border-t border-slate-800 pt-7 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} TCSN Network. All rights reserved.</p>

          <div className="flex gap-5">
            <a href="#" className="hover:text-white">
              Privacy
            </a>
            <a href="#" className="hover:text-white">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}