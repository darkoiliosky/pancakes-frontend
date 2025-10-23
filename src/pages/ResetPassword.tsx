import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useResetPassword } from "../api/usePasswordReset";

const schema = z
  .object({
    password: z.string().min(6, "Лозинката мора да има најмалку 6 знаци"),
    confirm: z.string().min(6, "Потврдата мора да има најмалку 6 знаци"),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Лозинките не се совпаѓаат",
  });

type FormData = z.infer<typeof schema>;

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const mutation = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!token) return;
    try {
      await mutation.mutateAsync({ token, password: data.password });
      alert("Лозинката е успешно променета. Најавете се повторно.");
      reset();
      navigate("/login");
    } catch (e: any) {
      alert(e?.message || "Настана грешка");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fffdf8]">
      <div className="w-full max-w-md bg-white p-8 shadow-md rounded-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-brand">Ресетирај лозинка</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Нова лозинка</label>
            <input
              type="password"
              {...register("password")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Потврди лозинка</label>
            <input
              type="password"
              {...register("confirm")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            />
            {errors.confirm && (
              <p className="text-red-500 text-sm mt-1">{errors.confirm.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand hover:bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-60"
          >
            {isSubmitting ? "Се зачувува..." : "Зачувај"}
          </button>
        </form>
        <div className="text-center mt-4">
          <Link to="/login" className="text-brand underline hover:text-yellow-600">
            Назад кон најава
          </Link>
        </div>
      </div>
    </div>
  );
}

