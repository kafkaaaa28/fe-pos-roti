import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { ChefHat, Eye, EyeOff, Lock, Mail, Phone, UserRound } from "lucide-react";
import Button from "../../components/common/Button";
import { useAuth } from "../../contexts/AuthContext";
import { getDashboardPath } from "../../utils/auth";
import type { RegisterPayload } from "../../types/auth";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  const maybeAxiosError = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
  };

  return maybeAxiosError.response?.data?.message ?? "Registrasi gagal diproses";
}

export default function Register() {
  const navigate = useNavigate();
  const { registerCustomer } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterPayload>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  const password = watch("password");

  const onSubmit = async (payload: RegisterPayload) => {
    setLoading(true);
    setErrorMessage("");

    try {
      const user = await registerCustomer({
        ...payload,
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
        phone: payload.phone?.trim(),
      });

      navigate(getDashboardPath(user.role), { replace: true });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md bg-surface border border-white/10 rounded-3xl p-7 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-7">
          <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center">
            <ChefHat size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-display text-2xl font-bold leading-tight">Daftar Customer</h1>
            <p className="text-white/45 text-sm">Akun ini dipakai untuk order online</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-white/70">Nama Lengkap</label>
            <div className="relative">
              <UserRound size={17} className="absolute left-3 top-3.5 text-white/35" />
              <input
                {...register("name", {
                  required: "Nama wajib diisi",
                  minLength: {
                    value: 3,
                    message: "Nama minimal 3 karakter",
                  },
                })}
                autoComplete="name"
                placeholder="Nama customer"
                className="w-full rounded-xl border border-white/10 bg-dark p-3 pl-10 text-white outline-none transition placeholder:text-white/25 focus:border-primary"
              />
            </div>
            {errors.name?.message && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Email</label>
            <div className="relative">
              <Mail size={17} className="absolute left-3 top-3.5 text-white/35" />
              <input
                {...register("email", {
                  required: "Email wajib diisi",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Format email belum benar",
                  },
                })}
                type="email"
                autoComplete="email"
                placeholder="customer@email.com"
                className="w-full rounded-xl border border-white/10 bg-dark p-3 pl-10 text-white outline-none transition placeholder:text-white/25 focus:border-primary"
              />
            </div>
            {errors.email?.message && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Nomor HP</label>
            <div className="relative">
              <Phone size={17} className="absolute left-3 top-3.5 text-white/35" />
              <input
                {...register("phone", {
                  pattern: {
                    value: /^[0-9+\-\s]{10,18}$/,
                    message: "Nomor HP belum benar",
                  },
                })}
                autoComplete="tel"
                placeholder="08xxxxxxxxxx"
                className="w-full rounded-xl border border-white/10 bg-dark p-3 pl-10 text-white outline-none transition placeholder:text-white/25 focus:border-primary"
              />
            </div>
            {errors.phone?.message && <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Password</label>
            <div className="relative">
              <Lock size={17} className="absolute left-3 top-3.5 text-white/35" />
              <input
                {...register("password", {
                  required: "Password wajib diisi",
                  minLength: {
                    value: 6,
                    message: "Password minimal 6 karakter",
                  },
                })}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Minimal 6 karakter"
                className="w-full rounded-xl border border-white/10 bg-dark p-3 pl-10 pr-11 text-white outline-none transition placeholder:text-white/25 focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-3 text-white/45 transition hover:text-white"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
            {errors.password?.message && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Konfirmasi Password</label>
            <div className="relative">
              <Lock size={17} className="absolute left-3 top-3.5 text-white/35" />
              <input
                {...register("passwordConfirmation", {
                  required: "Konfirmasi password wajib diisi",
                  validate: (value) => value === password || "Konfirmasi password tidak sama",
                })}
                type={showConfirmation ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Ulangi password"
                className="w-full rounded-xl border border-white/10 bg-dark p-3 pl-10 pr-11 text-white outline-none transition placeholder:text-white/25 focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowConfirmation((value) => !value)}
                className="absolute right-3 top-3 text-white/45 transition hover:text-white"
                aria-label={showConfirmation ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
              >
                {showConfirmation ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
            {errors.passwordConfirmation?.message && (
              <p className="mt-1 text-xs text-red-400">{errors.passwordConfirmation.message}</p>
            )}
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Mendaftarkan..." : "Daftar & Masuk"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-white/45">
          Sudah punya akun?{" "}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
