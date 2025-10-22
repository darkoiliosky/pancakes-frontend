import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm fixed w-full top-0 left-0 z-50">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          to="/"
          className="text-2xl font-bold text-brand flex items-center gap-2"
        >
          🥞 <span>Pancakes Shop</span>
        </Link>

        <div className="flex items-center gap-5">
          {!user ? (
            <>
              <Link
                to="/login"
                className="text-brand hover:text-yellow-600 transition"
              >
                Најава
              </Link>
              <Link
                to="/register"
                className="text-brand hover:text-yellow-600 transition"
              >
                Регистрација
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/profile"
                className="text-brand hover:text-yellow-600 transition"
              >
                Профил
              </Link>
              <button
                onClick={logout}
                className="text-red-500 hover:text-red-700 transition"
              >
                Одјава
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
