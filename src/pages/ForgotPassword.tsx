import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForgotPassword } from "../api/usePasswordReset";
import { Link } from "react-router-dom";

const schema = z.object({ email: z.string().email("Внесете валидна е-пошта") });
type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const mutation = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await mutation.mutateAsync({ email: data.email });
      alert("Ако е-поштата постои, испративме линк за ресетирање.");
      reset();
    } catch (e: any) {
      alert(e?.message || "Настана грешка");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fffdf8]">
      <div className="w-full max-w-md bg-white p-8 shadow-md rounded-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-brand">Заборавена лозинка</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Е-пошта</label>
            <input
              type="email"
              {...register("email")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand hover:bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-60"
          >
            {isSubmitting ? "Испраќаме..." : "Испрати линк"}
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

