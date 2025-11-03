// src/pages/Register.tsx
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "../api/client";
import { useToast } from "../context/ToastContext";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(6, "Enter a valid phone number"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const toast = useToast();
  const invite = params.get("invite") || "";
  const inviteEmail = params.get("email") || "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      if (invite) {
        await apiClient.post("/api/users/register-invite", { ...data, email: inviteEmail || data.email, invite_token: invite });
        toast.success("Invitation accepted. You can now log in as courier.");
      } else {
        await registerUser(data);
        toast.success("Registration successful. Please verify your email.");
      }
      navigate("/login");
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || "Registration failed");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fffdf8]">
      <div className="w-full max-w-md bg-white p-8 shadow-md rounded-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-brand">Register</h1>

        {invite && (
          <div className="mb-4 rounded bg-blue-50 border border-blue-200 text-blue-800 text-sm px-3 py-2">
            Courier invitation detected for <b>{inviteEmail}</b>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="block mb-1 text-sm font-medium">Name</label>
            <input
              id="name"
              type="text"
              {...register("name")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium">Email</label>
            <input
              id="email"
              type="email"
              defaultValue={inviteEmail}
              disabled={!!invite}
              {...register("email")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 text-sm font-medium">Password</label>
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
          <div>
            <label htmlFor="phone" className="block mb-1 text-sm font-medium">Phone</label>
            <input
              id="phone"
              type="text"
              {...register("phone")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand hover:bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;

