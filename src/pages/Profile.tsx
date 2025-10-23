import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "../components/ui/card";
import { UserIcon, MailIcon, PhoneIcon, ShieldIcon, EditIcon, XIcon, CheckIcon } from "lucide-react";
import { useUpdateProfile } from "../api/useUpdateProfile";

const profileSchema = z.object({
  name: z.string().min(2, "Името мора да има најмалку 2 знака"),
  phone: z.string().min(6, "Телефонот мора да има најмалку 6 знаци"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || "", phone: user?.phone || "" },
  });

  if (!user)
    return (
      <div className="flex justify-center items-center h-[70vh] text-gray-600">
        <p>Немате активна сесија.</p>
      </div>
    );

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync({ name: data.name, phone: data.phone });
      await refreshUser();
      setIsEditing(false);
      reset(data);
    } catch (err: any) {
      console.error("Update profile error:", err);
      alert(err?.message || "Настана грешка при ажурирање");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-gradient-to-b from-[#fffaf4] to-[#fffdf8] px-4">
      <Card className="w-full max-w-md shadow-lg border border-amber-100 rounded-2xl bg-white/90 hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="text-center border-b border-amber-50 py-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.name
                )}&background=f8b400&color=fff`}
                alt="avatar"
                className="w-24 h-24 rounded-full border-[5px] border-amber-300 shadow-md transition-transform duration-300 hover:scale-105"
              />
            </div>
            <h2 className="text-2xl font-bold text-amber-600 flex items-center gap-2 mt-1">
              <UserIcon className="w-6 h-6 text-amber-500" /> Профил
            </h2>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 mt-5 px-6">
          {!isEditing ? (
            <>
              <ProfileRow icon={<UserIcon />} label="Име" value={user.name} />
              <ProfileRow icon={<MailIcon />} label="Е-пошта" value={user.email} />
              <ProfileRow icon={<PhoneIcon />} label="Телефон" value={user.phone || "—"} />
              <ProfileRow icon={<ShieldIcon />} label="Улога" value={user.role || ""} />
            </>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <InputField label="Име" error={errors.name?.message} register={register("name")} />
              <InputField label="Телефон" error={errors.phone?.message} register={register("phone")} />
              <div className="flex justify-end gap-2">
                <Button type="button" onClick={() => setIsEditing(false)}>
                  <XIcon className="w-4 h-4 mr-1" /> Откажи
                </Button>
                <Button type="submit" variant="default" disabled={isSubmitting}>
                  <CheckIcon className="w-4 h-4 mr-1" />{` `}
                  {isSubmitting ? "Се ажурира..." : "Зачувај"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex justify-between py-5 px-6">
          <Button
            variant="default"
            onClick={() => {
              setIsEditing(true);
              reset({ name: user.name, phone: user.phone || "" });
            }}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600"
          >
            <EditIcon className="w-4 h-4" /> Уреди профил
          </Button>
          <Button
            variant="destructive"
            onClick={logout}
            className="flex items-center gap-2 px-6 py-2 text-sm font-semibold rounded-xl"
          >
            Одјава
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

const ProfileRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-3 text-gray-800">
    <div className="text-amber-500">{icon}</div>
    <p>
      <strong>{label}:</strong> {value}
    </p>
  </div>
);

const InputField = ({
  label,
  error,
  register,
}: {
  label: string;
  error?: string;
  register: any;
}) => (
  <div>
    <label className="block text-sm font-medium mb-1 text-gray-700">{label}</label>
    <input
      type="text"
      {...register}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

