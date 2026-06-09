import { Mail, MapPin, Phone } from "lucide-react";

const CONTACTS = [
  {
    label: "Alamat",
    value: "Jl. Roti Manis No. 10, Blitar",
    icon: MapPin,
  },
  {
    label: "Telepon",
    value: "0812-3456-7890",
    icon: Phone,
  },
  {
    label: "Email",
    value: "admin@tokoroti.com",
    icon: Mail,
  },
];

export default function Contact() {
  return (
    <div className="min-h-screen bg-dark pt-24 px-6 pb-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-5xl text-white mb-3">Kontak</h1>
        <p className="text-white/50 mb-10">
          Hubungi toko untuk informasi produk, pemesanan, atau kerja sama.
        </p>

        <div className="grid md:grid-cols-3 gap-5">
          {CONTACTS.map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-surface border border-white/10 rounded-2xl p-6">
              <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center mb-4">
                <Icon className="text-accent" size={18} />
              </div>
              <p className="text-white/40 text-xs mb-1">{label}</p>
              <p className="text-white text-sm">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
