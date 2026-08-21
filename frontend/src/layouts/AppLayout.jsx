import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="app-shell">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="app-main">
        <Topbar onMenu={() => setOpen((v) => !v)} />
        <main className="page">
          <Outlet />
        </main>
      </div>
      {open && <div className="nav-scrim" onClick={() => setOpen(false)} />}
    </div>
  );
}
