import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CartMini from "../public/components/CartMini";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm fixed w-full top-0 left-0 z-50">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-brand flex items-center gap-2">
          <span role="img" aria-label="pancakes">🥞</span>
          <span>Pancakes Shop</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-5">
          <NavLink to="/menu" className={({ isActive }) => `transition ${isActive ? "text-amber-700" : "text-brand hover:text-yellow-600"}`}>Menu</NavLink>
          {(!user || (user.role || "").toLowerCase() === "customer") && <CartMini />}
          {!user ? (
            <>
              <NavLink to="/login" className={({ isActive }) => `transition ${isActive ? "text-amber-700" : "text-brand hover:text-yellow-600"}`}>Login</NavLink>
              <NavLink to="/register" className={({ isActive }) => `transition ${isActive ? "text-amber-700" : "text-brand hover:text-yellow-600"}`}>Register</NavLink>
            </>
          ) : (
            <>
              {(user.role || "").toLowerCase() === "admin" && (
                <NavLink to="/admin" className={({ isActive }) => `transition ${isActive ? "text-amber-700" : "text-brand hover:text-yellow-600"}`}>Admin</NavLink>
              )}
              {(user.role || "").toLowerCase() === "courier" && (
                <NavLink to="/courier" className={({ isActive }) => `transition ${isActive ? "text-amber-700" : "text-brand hover:text-yellow-600"}`}>Deliveries</NavLink>
              )}
              {(user.role || "").toLowerCase() === "customer" && (
                <NavLink to="/orders" className={({ isActive }) => `transition ${isActive ? "text-amber-700" : "text-brand hover:text-yellow-600"}`}>My Orders</NavLink>
              )}
              <NavLink to="/profile" className={({ isActive }) => `transition ${isActive ? "text-amber-700" : "text-brand hover:text-yellow-600"}`}>Profile</NavLink>
              <button onClick={logout} className="text-red-500 hover:text-red-700 transition">Logout</button>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button className="md:hidden text-brand" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          ☰
        </button>
      </nav>
      {/* Mobile panel */}
      {open && (
        <div className="md:hidden bg-white border-t">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3">
            <NavLink to="/menu" onClick={() => setOpen(false)} className={({ isActive }) => `transition ${isActive ? "text-amber-700" : "text-brand hover:text-yellow-600"}`}>Menu</NavLink>
            {(!user || (user.role || "").toLowerCase() === "customer") && <CartMini />}
            {!user ? (
              <>
                <NavLink to="/login" onClick={() => setOpen(false)} className={({ isActive }) => `transition ${isActive ? "text-amber-700" : "text-brand hover:text-yellow-600"}`}>Login</NavLink>
                <NavLink to="/register" onClick={() => setOpen(false)} className={({ isActive }) => `transition ${isActive ? "text-amber-700" : "text-brand hover:text-yellow-600"}`}>Register</NavLink>
              </>
            ) : (
              <>
                {(user.role || "").toLowerCase() === "admin" && (
                  <NavLink to="/admin" onClick={() => setOpen(false)} className={({ isActive }) => `transition ${isActive ? "text-amber-700" : "text-brand hover:text-yellow-600"}`}>Admin</NavLink>
                )}
                {(user.role || "").toLowerCase() === "courier" && (
                  <NavLink to="/courier" onClick={() => setOpen(false)} className={({ isActive }) => `transition ${isActive ? "text-amber-700" : "text-brand hover:text-yellow-600"}`}>Deliveries</NavLink>
                )}
                {(user.role || "").toLowerCase() === "customer" && (
                  <NavLink to="/orders" onClick={() => setOpen(false)} className={({ isActive }) => `transition ${isActive ? "text-amber-700" : "text-brand hover:text-yellow-600"}`}>My Orders</NavLink>
                )}
                <NavLink to="/profile" onClick={() => setOpen(false)} className={({ isActive }) => `transition ${isActive ? "text-amber-700" : "text-brand hover:text-yellow-600"}`}>Profile</NavLink>
                <button onClick={() => { setOpen(false); logout(); }} className="text-red-500 hover:text-red-700 transition text-left">Logout</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
