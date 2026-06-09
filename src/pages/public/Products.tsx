import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, ShoppingCart, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  PUBLIC_PRODUCT_CATEGORIES,
  type PublicProduct,
  type PublicProductCategory,
} from "../../data/publicProducts";
import { preloadImages } from "../../utils/imageCache";
import { getPublicProducts } from "../../services/product.service";
import { getApiErrorMessage } from "../../services/error";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";

type ActiveCategory = "all" | PublicProductCategory;

export default function Products() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>("all");
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { addItem } = useCart();

  useEffect(() => {
    getPublicProducts()
      .then((items) => {
        setProducts(items);
        preloadImages(items.map((item) => item.image).filter((url): url is string => Boolean(url)));
      })
      .catch((err) => setError(getApiErrorMessage(err, "Gagal memuat produk dari backend.")))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = activeCategory === "all" || product.category === activeCategory;
      const matchesQuery = `${product.name} ${product.desc} ${product.tag} ${product.categoryLabel}`
        .toLowerCase()
        .includes(query.toLowerCase());

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query, products]);

  const groupedProducts = useMemo(() => {
    return PUBLIC_PRODUCT_CATEGORIES.filter((category) => category.id !== "all")
      .map((category) => ({
        ...category,
        products: filteredProducts.filter((product) => product.category === category.id),
      }))
      .filter((category) => category.products.length > 0);
  }, [filteredProducts]);

  const handleAddToCart = (product: PublicProduct) => {
    if (!user) {
      sessionStorage.setItem(
        "pending-cart-item",
        JSON.stringify({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          qty: 1,
        })
      );

      navigate("/login", {
        state: {
          from: location.pathname,
          message: "Silakan login atau daftar terlebih dahulu untuk menambahkan produk ke keranjang.",
        },
      });

      return;
    }

    if (user.role !== "CUSTOMER") {
      navigate("/login", {
        state: {
          from: location.pathname,
          message: "Keranjang hanya tersedia untuk akun customer.",
        },
      });

      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      qty: 1,
    });

    navigate("/customer/cart");
  };

  return (
    <div className="min-h-screen bg-dark px-4 pb-16 pt-28 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center sm:mb-12"
        >
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-4 py-2 text-xs font-bold text-accent shadow-lg shadow-accent/10">
            <Sparkles size={13} fill="currentColor" />
            Beard Papa's Menu
          </span>

          <h1 className="mb-3 font-display text-4xl text-white sm:text-5xl">Menu Kami</h1>

          <p className="mx-auto max-w-2xl text-white/55">
            Menu dipisah per kategori: shell, filling, dan dessert.
            Untuk menambahkan ke keranjang, customer perlu login atau daftar terlebih dahulu.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mx-auto mb-6 max-w-xl"
        >
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari cream puff, eclair, atau dessert..."
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-surface px-11 py-3 text-sm text-white outline-none transition-all placeholder:text-white/35 focus:border-accent/70 focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </motion.div>

        <div className="mb-10 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-3 sm:justify-center">
            {PUBLIC_PRODUCT_CATEGORIES.map((category) => {
              const isActive = activeCategory === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all active:scale-95 ${
                    isActive
                      ? "border-accent bg-accent text-dark shadow-lg shadow-accent/20"
                      : "border-white/10 bg-surface text-white/70 hover:border-accent/60 hover:text-accent"
                  }`}
                >
                  <span className="block whitespace-nowrap">{category.title}</span>
                  <span className={`mt-0.5 block text-xs ${isActive ? "text-dark/60" : "text-white/35"}`}>
                    {category.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="mt-12 rounded-2xl border border-white/10 bg-surface p-8 text-center text-white/45">
            Memuat produk dari backend...
          </div>
        ) : error ? (
          <div className="mt-12 rounded-2xl border border-red-400/20 bg-red-500/10 p-8 text-center text-red-100">
            {error}
          </div>
        ) : activeCategory === "all" ? (
          <div className="space-y-16">
            {groupedProducts.map((section) => (
              <section key={section.id}>
                <div className="mb-7 text-center">
                  <h2 className="font-display text-2xl font-bold uppercase tracking-[0.08em] text-accent sm:text-3xl">
                    {section.title}
                  </h2>
                  <div className="mx-auto mt-4 h-px max-w-lg bg-accent/80" />
                  <p className="mt-3 text-sm text-white/45">{section.subtitle}</p>
                </div>

                <ProductGrid products={section.products} onAddToCart={handleAddToCart} />
              </section>
            ))}
          </div>
        ) : (
          <ProductGrid products={filteredProducts} onAddToCart={handleAddToCart} />
        )}

        {!loading && !error && filteredProducts.length === 0 && (
          <div className="mt-12 rounded-2xl border border-white/10 bg-surface p-8 text-center text-white/45">
            Belum ada data produk dari backend.
          </div>
        )}
      </div>
    </div>
  );
}

function ProductGrid({
  products,
  onAddToCart,
}: {
  products: PublicProduct[];
  onAddToCart: (product: PublicProduct) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6">
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.045 }}
          whileHover={{ y: -6 }}
          className="group min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-surface transition-all hover:border-accent/60 hover:shadow-2xl hover:shadow-accent/10 sm:rounded-3xl"
        >
          <div className="relative h-36 overflow-hidden bg-cream sm:h-60">
            <img
              src={product.image}
              alt={product.name}
              width="700"
              height="700"
              loading={index < 3 ? "eager" : "lazy"}
              decoding="async"
              className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105 sm:p-4"
            />

            <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-white shadow-lg shadow-primary/20 sm:left-4 sm:top-4 sm:px-3 sm:text-xs">
              {product.tag}
            </span>

            <span className="absolute right-2 top-2 max-w-[72px] truncate rounded-full bg-accent px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-dark shadow-lg shadow-accent/20 sm:right-4 sm:top-4 sm:max-w-none sm:px-3 sm:text-[10px]">
              {product.categoryLabel}
            </span>
          </div>

          <div className="p-3 sm:p-5">
            <h3 className="mb-1 line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-5 text-white sm:min-h-0 sm:text-lg">{product.name}</h3>

            <p className="mb-4 line-clamp-2 min-h-9 text-xs leading-5 text-white/50 sm:mb-5 sm:min-h-10 sm:text-sm">{product.desc}</p>

            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-bold text-accent sm:text-base">
                Rp {product.price.toLocaleString("id-ID")}
              </span>

              <button
                type="button"
                onClick={() => onAddToCart(product)}
                className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-dark shadow-lg shadow-accent/15 transition-colors hover:bg-cream active:scale-95 sm:min-h-11 sm:w-auto sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
              >
                <ShoppingCart size={15} />
                Tambah
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
