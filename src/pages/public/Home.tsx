import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Star, ChefHat, Clock, ShieldCheck, Sparkles } from "lucide-react";
import type { PublicProduct } from "../../data/publicProducts";
import { preloadImages } from "../../utils/imageCache";
import { getPublicProducts } from "../../services/product.service";

const FADE_UP = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
});

const FEATURES = [
  { icon: ChefHat, title: "Dibuat Fresh", desc: "Shell dan filling disiapkan segar setiap hari" },
  { icon: Clock, title: "Order Online", desc: "Pilih menu, checkout, lalu ambil di toko" },
  { icon: ShieldCheck, title: "Menu Beragam", desc: "Shell, filling, dan dessert dalam satu katalog" },
];

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<PublicProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    getPublicProducts()
      .then((items) => {
        const featured = items.slice(0, 3);
        setFeaturedProducts(featured);
        preloadImages(featured.map((item) => item.image).filter((url): url is string => Boolean(url)));
      })
      .catch(() => setFeaturedProducts([]))
      .finally(() => setProductsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-dark font-body">
      <section className="relative overflow-hidden px-4 pb-16 pt-28 sm:px-6 lg:pb-24 lg:pt-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute -right-32 bottom-20 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
          <div className="absolute left-1/2 top-1/4 h-64 w-64 -translate-x-1/2 rounded-full bg-mint/10 blur-2xl" />
        </div>

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              {...FADE_UP(0)}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/35 bg-accent/15 px-4 py-2 text-xs font-bold text-accent shadow-lg shadow-accent/10"
            >
              <Star size={12} fill="currentColor" />
              Beard Papa's Fresh Cream Puff
            </motion.div>

            <motion.h1
              {...FADE_UP(0.1)}
              className="mb-6 font-display text-4xl leading-tight text-white sm:text-5xl lg:text-7xl"
            >
              Cream Puff <span className="text-accent">Fresh</span>
              <br />
              Setiap <span className="text-mint">Hari</span>
            </motion.h1>

            <motion.p
              {...FADE_UP(0.2)}
              className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg lg:mb-10"
            >
              Nikmati cream puff dan dessert fresh dengan pilihan shell dan filling favorit.
              Pilih menu, pesan online, lalu ambil di toko.
            </motion.p>

            <motion.div {...FADE_UP(0.3)} className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Link
                to="/products"
                className="group flex min-h-12 items-center gap-2 rounded-xl bg-accent px-6 py-3.5 font-bold text-dark shadow-lg shadow-accent/20 transition-all duration-300 hover:bg-cream active:scale-95 sm:px-8"
              >
                Pesan Sekarang
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                to="/products"
                className="flex min-h-12 items-center rounded-xl border border-white/20 px-6 py-3.5 font-bold text-white/80 transition-all duration-300 hover:border-accent hover:text-accent active:scale-95 sm:px-8"
              >
                Lihat Menu
              </Link>
            </motion.div>

            <motion.div
              {...FADE_UP(0.4)}
              className="mx-auto mt-10 grid max-w-md grid-cols-3 gap-4 sm:mt-12"
            >
              {[
                ["14+", "Menu tersedia"],
                ["3", "Kategori menu"],
                ["Fresh", "Dibuat harian"],
              ].map(([number, label]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-surface/75 p-4 shadow-xl shadow-black/20 backdrop-blur"
                >
                  <p className="font-display text-xl font-bold text-accent sm:text-2xl">{number}</p>
                  <p className="mt-1 text-[11px] text-white/45 sm:text-xs">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            {...FADE_UP(0.48)}
            className="mt-14 rounded-[2rem] border border-white/10 bg-surface/70 p-4 shadow-2xl shadow-black/25 backdrop-blur sm:p-6 lg:mt-16"
          >
            <div className="mb-6 flex flex-col gap-2 text-center sm:mb-8">
              <span className="mx-auto inline-flex items-center gap-2 rounded-full bg-accent/15 px-4 py-2 text-xs font-bold text-accent">
                <Sparkles size={13} fill="currentColor" />
                Menu Unggulan
              </span>
              <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Favorit Pelanggan Beard Papa's
              </h2>
              <p className="mx-auto max-w-xl text-sm text-white/50">
                Beberapa menu pilihan dari kategori shell, filling, dan dessert.
              </p>
            </div>

            {productsLoading ? (
              <div className="rounded-2xl border border-white/10 bg-dark/60 p-8 text-center text-sm text-white/45">Memuat menu unggulan...</div>
            ) : featuredProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-dark/60 p-8 text-center text-sm text-white/45">Belum ada data menu unggulan dari backend.</div>
            ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.58 + index * 0.08 }}
                  whileHover={{ y: -6 }}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-dark/80 shadow-xl shadow-black/25 transition-all hover:border-accent/60 hover:shadow-accent/10"
                >
                  <div className="relative h-48 bg-cream sm:h-56">
                    <img
                      src={product.image}
                      alt={product.name}
                      width="500"
                      height="500"
                      loading={index === 0 ? "eager" : "lazy"}
                      decoding="async"
                      className="h-full w-full object-contain p-5 transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow-lg">
                      {product.tag}
                    </span>
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
                      {product.categoryLabel}
                    </p>
                    <h3 className="mt-2 text-lg font-bold text-white">{product.name}</h3>
                    <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-white/50">
                      {product.desc}
                    </p>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <span className="font-bold text-accent">
                        Rp {product.price.toLocaleString("id-ID")}
                      </span>
                      <Link
                        to="/products"
                        className="rounded-xl bg-accent px-4 py-2 text-sm font-bold text-dark transition-colors hover:bg-cream active:scale-95"
                      >
                        Lihat
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <motion.div
          className="mb-12 text-center sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-4 font-display text-3xl text-white sm:text-4xl">Kenapa Pilih Kami?</h2>
          <p className="text-white/50">Komitmen kami untuk kualitas terbaik</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -6 }}
              className="rounded-2xl border border-white/10 bg-surface p-6 shadow-xl shadow-black/15 transition-colors hover:border-accent/50"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15">
                <Icon className="text-accent" size={22} />
              </div>
              <h3 className="mb-2 font-semibold text-white">{title}</h3>
              <p className="text-sm text-white/50">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
