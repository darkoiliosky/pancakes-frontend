import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CartMini from "../public/components/CartMini";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm fixed w-full top-0 left-0 z-50">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-brand flex items-center gap-2">
          <span role="img" aria-label="pancakes">🥞</span>
          <span>Pancakes Shop</span>
        </Link>

        <div className="flex items-center gap-5">
          <Link to="/menu" className="text-brand hover:text-yellow-600 transition">
            Menu
          </Link>
          <CartMini />
          {!user ? (
            <>
              <Link to="/login" className="text-brand hover:text-yellow-600 transition">
                Login
              </Link>
              <Link to="/register" className="text-brand hover:text-yellow-600 transition">
                Register
              </Link>
            </>
          ) : (
            <>
              {user.role === "admin" && (
                <Link to="/admin" className="text-brand hover:text-yellow-600 transition">
                  Admin
                </Link>
              )}
              <Link to="/orders" className="text-brand hover:text-yellow-600 transition">
                My Orders
              </Link>
              <Link to="/profile" className="text-brand hover:text-yellow-600 transition">
                Profile
              </Link>
              <button onClick={logout} className="text-red-500 hover:text-red-700 transition">
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

