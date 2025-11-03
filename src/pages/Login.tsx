import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const loginSchema = z.object({
  email: z.string().email("Внесете валидна е-пошта"),
  password: z.string().min(6, "Лозинката мора да има најмалку 6 знаци"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      navigate("/");
    } catch (error: any) {
      const message = (error?.response?.data?.error as string) || (error?.message as string) || "Настана грешка";
      alert(message);
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fffdf8]">
      <div className="w-full max-w-md bg-white p-8 shadow-md rounded-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-brand">Најава</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium">Е-пошта</label>
            <input
              id="email"
              type="email"
              {...register("email")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 text-sm font-medium">Лозинка</label>
            <input
              id="password"
              type="password"
              {...register("password")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="text-right -mt-2">
            <Link to="/forgot-password" className="text-sm text-brand underline hover:text-yellow-600">
              Заборавена лозинка
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand hover:bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-60"
          >
            {isSubmitting ? "Се најавувам..." : "Најави се"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
