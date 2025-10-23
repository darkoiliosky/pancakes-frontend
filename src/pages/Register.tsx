// src/pages/Register.tsx
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const registerSchema = z.object({
  name: z.string().min(2, "Името мора да содржи најмалку 2 карактери"),
  email: z.string().email("Внеси валиден емаил"),
  password: z.string().min(6, "Лозинката мора да содржи најмалку 6 карактери"),
  phone: z.string().min(6, "Внесете валиден телефонски број"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data);
      alert(
        "✅ Успешна регистрација! Провери го е-пошта сандачето и кликни на линкот за потврда."
      );
      navigate("/login"); // ✅ одиме на Login, не на Home
    } catch (error: any) {
      alert("❌ Грешка при регистрација");
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fffdf8]">
      <div className="w-full max-w-md bg-white p-8 shadow-md rounded-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-brand">
          Регистрација
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Име</label>
            <input
              type="text"
              {...register("name")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Е-пошта</label>
            <input
              type="email"
              {...register("email")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Лозинка</label>
            <input
              type="password"
              {...register("password")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Телефон</label>
            <input
              type="text"
              {...register("phone")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">
                {errors.phone.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand hover:bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-60"
          >
            {isSubmitting ? "Се регистрираш..." : "Регистрирај се"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
