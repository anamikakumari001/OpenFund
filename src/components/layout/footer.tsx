import Link from "next/link";
import { GitBranch } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 rounded-md bg-gray-900 flex items-center justify-center">
                <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                  <path d="M8 2L14 6V10L8 14L2 10V6L8 2Z" fill="white" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900">OpenFund</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              The home of open source funding. Transparent, developer-first, powered by Stellar.
            </p>
            <div className="flex gap-2 mt-5">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
              >
                <GitBranch className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
          </div>

          {[
            {
              title: "Platform",
              links: [
                { label: "Explore Projects", href: "/explore" },
                { label: "Trending", href: "/explore?tab=trending" },
                { label: "Contributor Marketplace", href: "/explore?tab=marketplace" },
                { label: "Analytics", href: "/dashboard" },
              ],
            },
            {
              title: "For Maintainers",
              links: [
                { label: "Launch Project", href: "/dashboard/new" },
                { label: "Dashboard", href: "/dashboard" },
                { label: "Milestone Funding", href: "/dashboard" },
                { label: "Treasury", href: "/dashboard" },
              ],
            },
            {
              title: "Resources",
              links: [
                { label: "Documentation", href: "/" },
                { label: "GitHub Integration", href: "/" },
                { label: "Stellar Integration", href: "/" },
                { label: "API", href: "/" },
              ],
            },
          ].map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} OpenFund. Fund the future of open source.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span>Powered by</span>
            <span className="text-gray-700 font-medium">Stellar Network</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
