import { useAuth } from "../context/AuthContext";

function Profile() {
  const { user, logout } = useAuth();

  if (!user) return <p>Нема податоци за корисник.</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fffdf8]">
      <div className="bg-white shadow-md p-8 rounded-2xl w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-brand mb-4">👤 Профил</h1>
        <p>
          <strong>Име:</strong> {user.name}
        </p>
        <p>
          <strong>Е-пошта:</strong> {user.email}
        </p>
        {user.role && (
          <p>
            <strong>Улога:</strong> {user.role}
          </p>
        )}

        <button
          onClick={logout}
          className="mt-6 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
        >
          Одјава
        </button>
      </div>
    </div>
  );
}

export default Profile;
