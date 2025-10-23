import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  const navItems = [
    { to: "/admin", label: "Dashboard", end: true },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/shop", label: "Shop Settings" },
    { to: "/admin/menu-items", label: "Menu Items" },
    { to: "/admin/orders", label: "Orders" },
    { to: "/admin/deliveries", label: "Deliveries" },
  ];

  return (
    <div className="min-h-screen bg-[#fffdf8] text-gray-800 flex">
      <aside className="w-64 border-r bg-white/80 backdrop-blur px-4 py-6 hidden md:block">
        <h2 className="text-xl font-bold mb-6 text-amber-600">Admin Panel</h2>
        <nav className="flex flex-col gap-2">
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end === true}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg ${
                  isActive
                    ? "bg-amber-100 text-amber-700 font-semibold"
                    : "hover:bg-amber-50"
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
