/**
 * App Shell : sidebar fine + topbar
 * Design premium education dashboard
 */

import { Link, useLocation, Outlet } from "react-router-dom";
import { LayoutDashboard, FolderPlus, Bell, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../../api/axios.js";
import { logout } from "../../api/auth.js";
import Logo from "../ui/Logo.jsx";

export default function AppShell({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [pendingSupervisionCount, setPendingSupervisionCount] = useState(0);

  useEffect(() => {
    api.get("/api/me/").then(({ data }) => {
      setUser(data);
      if (data?.is_staff) {
        api.get("/api/supervision-requests/pending-count/").then(
          (r) => setPendingSupervisionCount(r.data?.count ?? 0)
        ).catch(() => setPendingSupervisionCount(0));
      }
    }).catch(() => setUser(null));
  }, []);

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/projects/new", icon: FolderPlus, label: "Nouveau projet" },
  ];

  const isActive = (path) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar fine à icônes */}
      <aside className="w-16 shrink-0 border-r border-zinc-200/80 bg-white/80 backdrop-blur flex flex-col items-center py-4 gap-2">
        <Link
          to="/dashboard"
          className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
            location.pathname === "/dashboard"
              ? "bg-brand-600 text-white"
              : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
          }`}
          title="Dashboard"
        >
          <LayoutDashboard className="w-5 h-5" />
        </Link>
        <nav className="flex-1 flex flex-col gap-1 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              title={item.label}
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                isActive(item.to)
                  ? "bg-brand-600 text-white"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              }`}
            >
              <item.icon className="w-5 h-5" />
            </Link>
          ))}
        </nav>
        <Link
          to="/login"
          onClick={(e) => {
            e.preventDefault();
            logout();
            window.location.href = "/login";
          }}
          className="flex items-center justify-center w-10 h-10 rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
          title="Déconnexion"
        >
          <LogOut className="w-5 h-5" />
        </Link>
      </aside>

      {/* Zone principale : topbar + contenu */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-44 shrink-0 border-b border-zinc-200/80 bg-white/80 backdrop-blur flex items-center justify-between px-6">
          <div className="flex items-center flex-1 min-w-0">
            <Link
              to="/dashboard"
              className="flex items-center shrink-0 text-zinc-900 hover:opacity-80 transition-opacity"
              title="Gradely"
            >
              <Logo variant="navbar" className="max-h-40" />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {user?.is_staff && (
              <>
                {pendingSupervisionCount > 0 ? (
                  <Link
                    to="/supervision-requests"
                    className="relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                    title="Demandes de supervision"
                  >
                    <Bell className="w-5 h-5" />
                    <span>Demandes</span>
                    <span
                      className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-white"
                      aria-label={`${pendingSupervisionCount} en attente`}
                    >
                      {pendingSupervisionCount > 99 ? "99+" : pendingSupervisionCount}
                    </span>
                  </Link>
                ) : (
                  <Link
                    to="/supervision-requests"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                    title="Demandes de supervision"
                  >
                    <Bell className="w-5 h-5" />
                  </Link>
                )}
              </>
            )}
            <div
              className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold text-sm"
              title="Mon compte"
            >
              {user?.email?.[0]?.toUpperCase() ?? "?"}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto"><Outlet /></main>
      </div>
    </div>
  );
}
