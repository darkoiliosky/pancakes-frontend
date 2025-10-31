import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "../components/ui/card";
import { UserIcon, MailIcon, PhoneIcon, EditIcon, XIcon, CheckIcon } from "lucide-react";
import { useUpdateProfile } from "../api/useUpdateProfile";
import { useToast } from "../context/ToastContext";
import apiClient from "../api/client";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(6, "Phone must be at least 6 characters"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const toast = useToast();
  const updateProfile = useUpdateProfile();

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || "", phone: user?.phone || "" },
  });

  if (!user) {
    return (
      <div className="flex justify-center items-center h-[70vh] text-gray-600">
        <p>You must be logged in.</p>
      </div>
    );
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync({ name: data.name, phone: data.phone });
      await refreshUser();
      setIsEditing(false);
      reset(data);
      toast.success("Profile updated successfully");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e?.message || "Failed to update profile");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-gradient-to-b from-[#fffaf4] to-[#fffdf8] px-4">
      <Card className="w-full max-w-md shadow-lg border border-amber-100 rounded-2xl bg-white/90 hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="text-center border-b border-amber-50 py-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f8b400&color=fff`}
                alt="avatar"
                className="w-24 h-24 rounded-full border-[5px] border-amber-300 shadow-md transition-transform duration-300 hover:scale-105"
              />
            </div>
            <h2 className="text-2xl font-bold text-amber-600 flex items-center gap-2 mt-1">
              <UserIcon className="w-6 h-6 text-amber-500" /> {user.name}
            </h2>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 mt-5 px-6">
          {!isEditing ? (
            <>
              <ProfileRow icon={<UserIcon />} label="Name" value={user.name} />
              <ProfileRow icon={<MailIcon />} label="Email" value={user.email} />
              <ProfileRow icon={<PhoneIcon />} label="Phone" value={user.phone || "-"} />
            </>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <InputField label="Name" error={errors.name?.message} register={register("name")} />
              <InputField label="Phone" error={errors.phone?.message} register={register("phone")} />
              <div className="flex justify-end gap-2">
                <Button type="button" onClick={() => setIsEditing(false)}>
                  <XIcon className="w-4 h-4 mr-1" /> Cancel
                </Button>
                <Button type="submit" variant="default" disabled={isSubmitting}>
                  <CheckIcon className="w-4 h-4 mr-1" />
                  {isSubmitting ? "Saving..." : "Save"}
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
            <EditIcon className="w-4 h-4" /> Edit Profile
          </Button>
          <Button
            variant="destructive"
            onClick={logout}
            className="flex items-center gap-2 px-6 py-2 text-sm font-semibold rounded-xl"
          >
            Logout
          </Button>
        </CardFooter>

        <div className="px-6 pb-6">
          <div className="border-t pt-4 mt-2" />
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-800">Change your email</div>
            <div className="text-xs text-gray-600">We will send a confirmation to your new email before applying changes.</div>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={user.email}
                className="flex-1 border rounded-lg px-3 py-2"
              />
              <Button
                onClick={async () => {
                  try {
                    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { toast.error("Invalid email"); return; }
                    await apiClient.post('/api/users/email-change/request', { new_email: newEmail });
                    toast.success("Verification email sent");
                    setNewEmail("");
                  } catch (e: any) {
                    toast.error(e?.response?.data?.error || e?.message || "Failed to request email change");
                  }
                }}
              >
                Send verification
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

const ProfileRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-3 text-gray-800">
    <div className="text-amber-500">{icon}</div>
    <p>
      <strong>{label}:</strong> {value}
    </p>
  </div>
);

const InputField = ({ label, error, register }: { label: string; error?: string; register: any }) => (
  <div>
    <label className="block text-sm font-medium mb-1 text-gray-700">{label}</label>
    <input type="text" {...register} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none" />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);