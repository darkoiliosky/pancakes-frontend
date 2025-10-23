import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fffdf8] text-center" />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fffdf8] text-center">
      <h1 className="text-3xl font-bold text-brand mb-4">🍯 Pancakes Shop</h1>
      {user ? (
        <>
          <p className="mb-4">Добредојде, {user.name}!</p>
          {/* <Link
            to="/profile"
            className="text-brand underline hover:text-yellow-500 transition"
          >
            Профил
          </Link> */}
        </>
      ) : (
        <>
          <p className="mb-4">
            Добредојде! Најави се или регистрирај се за да продолжиш.
          </p>
          <div className="flex gap-4">
            <Link
              to="/login"
              className="bg-brand text-white px-4 py-2 rounded-lg hover:bg-yellow-500 transition"
            >
              Најава
            </Link>
            <Link
              to="/register"
              className="border border-brand text-brand px-4 py-2 rounded-lg hover:bg-brand hover:text-white transition"
            >
              Регистрација
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default Home;
