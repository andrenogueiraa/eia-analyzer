import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Leaf } from "lucide-react";

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white">
        <div className="container flex items-center justify-between px-4 py-4 mx-auto">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold hover:text-green-600"
          >
            <Leaf className="w-6 h-6 text-green-600" />
            <span>EIA Analyzer</span>
          </Link>
          <nav className="flex gap-6">
            <Link
              to="/"
              className="transition-colors hover:text-green-600"
              activeProps={{ className: "text-green-600 font-semibold" }}
            >
              Dashboard
            </Link>
            <Link
              to="/about"
              className="transition-colors hover:text-green-600"
              activeProps={{ className: "text-green-600 font-semibold" }}
            >
              About
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8 mx-auto">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-auto">
        <div className="container px-4 py-6 mx-auto text-sm text-center text-gray-600">
          Built with ❤️ using Bun + React + Convex + DeepSeek AI
        </div>
      </footer>

      {/* Dev Tools (only in development) */}
      <TanStackRouterDevtools />
    </div>
  ),
});
