import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen">
      {/* Header */}
      <header>
        <div className="container flex items-center justify-between h-16 px-4 mx-auto">
          <Link to="/" className="flex items-center gap-2 text-xl font-medium">
            <Icon icon="uim:analytics" />
            <span>EIA Analyzer</span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link to="/">
              {({ isActive }) => (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    isActive && "border-b-2 rounded-b-none border-primary"
                  )}
                >
                  Dashboard
                </Button>
              )}
            </Link>
            <Link to="/about">
              {({ isActive }) => (
                <Button variant={isActive ? "default" : "ghost"} size="sm">
                  About
                </Button>
              )}
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container flex-1 px-4 py-8 mx-auto">
        <Outlet />
      </main>

      {/* Footer */}
      <footer>
        <div className="container px-4 py-6 mx-auto">
          <p className="text-sm text-center text-muted-foreground">
            criado por André Nogueira
          </p>
        </div>
      </footer>

      {/* Dev Tools (only in development) */}
      <TanStackRouterDevtools />
    </div>
  ),
});
