import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, Save, User } from "lucide-react";
import CustomerShell from "../../components/customer/CustomerShell";
import Toast from "../../components/common/Toast";
import { useAuth } from "../../contexts/AuthContext";

const PROFILE_STORAGE_KEY = "beard-papas-customer-profile";

function readSavedProfile() {
  const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as { name?: string; email?: string; phone?: string };
  } catch {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    return null;
  }
}

export default function Profile() {
  const { user, updateUserProfile } = useAuth();
  const savedProfile = readSavedProfile();

  const [name, setName] = useState(savedProfile?.name || user?.name || "");
  const [email, setEmail] = useState(savedProfile?.email || user?.email || "");
  const [phone, setPhone] = useState(savedProfile?.phone || user?.phone || "");
  const [toastOpen, setToastOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const latestProfile = readSavedProfile();
    setName(latestProfile?.name || user.name || "");
    setEmail(latestProfile?.email || user.email || "");
    setPhone(latestProfile?.phone || user.phone || "");
  }, [user]);

  const handleSave = async () => {
    const nextProfile = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    };

    setSaving(true);
    try {
      const updated = await updateUserProfile(nextProfile);
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({
        name: updated?.name || nextProfile.name,
        email: updated?.email || nextProfile.email,
        phone: updated?.phone || nextProfile.phone,
      }));
      setToastOpen(true);
      window.setTimeout(() => setToastOpen(false), 2400);
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomerShell>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-surface p-5 shadow-xl shadow-black/15 sm:p-6"
      >
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">Customer Profile</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-white">Profil Customer</h1>
        <p className="mt-2 text-sm text-white/45">
          Data ini akan otomatis mengisi form checkout agar pemesanan lebih cepat.
        </p>

        <div className="mt-7 space-y-4">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/55">
              <User size={14} className="text-accent" /> Nama Customer
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nama lengkap"
              className="min-h-12 w-full rounded-xl border border-white/10 bg-dark/60 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent/60"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/55">
              <Mail size={14} className="text-accent" /> Email
            </span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="email@contoh.com"
              className="min-h-12 w-full rounded-xl border border-white/10 bg-dark/60 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent/60"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/55">
              <Phone size={14} className="text-accent" /> No. HP / WhatsApp
            </span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="08xxxxxxxxxx"
              className="min-h-12 w-full rounded-xl border border-white/10 bg-dark/60 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent/60"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-dark shadow-lg shadow-accent/20 transition-colors hover:bg-cream active:scale-95"
        >
          <Save size={17} /> {saving ? "Menyimpan..." : "Simpan Profil"}
        </button>
      </motion.div>

      <Toast open={toastOpen} tone="success" title="Profil diperbarui" message="Data profil akan dipakai otomatis saat checkout." />
    </CustomerShell>
  );
}
