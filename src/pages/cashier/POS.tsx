import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Banknote,
  Camera,
  CreditCard,
  Minus,
  Phone,
  Plus,
  Printer,
  QrCode,
  Receipt,
  Search,
  Send,
  ShoppingCart,
  StickyNote,
  Trash2,
  User,
  UserRoundCheck,
  X,
} from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import Modal from "../../components/common/Modal";
import Toast from "../../components/common/Toast";
import { useAuth } from "../../contexts/AuthContext";
import {
  PUBLIC_PRODUCT_CATEGORIES,
  PUBLIC_PRODUCTS,
  type PublicProduct,
  type PublicProductCategory,
} from "../../data/publicProducts";
import { getPublicProducts } from "../../services/product.service";
import { createOfflineTransaction } from "../../services/transaction.service";

const formatCurrency = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

type ActiveCategory = "all" | PublicProductCategory;
type PaymentMethod = "CASH" | "QRIS" | "TRANSFER";
type OrderType = "TAKE_AWAY" | "DINE_IN";
type CartItem = PublicProduct & { qty: number };

type ReceiptData = {
  invoice: string;
  date: string;
  cashier: string;
  customerName: string;
  customerPhone: string;
  note: string;
  orderType: OrderType;
  tableNumber?: string;
  paymentMethod: PaymentMethod;
  items: CartItem[];
  total: number;
  cashReceived: number;
  change: number;
};

const paymentOptions: {
  id: PaymentMethod;
  label: string;
  desc: string;
  icon: typeof Banknote;
}[] = [
  { id: "CASH", label: "Cash", desc: "Input uang diterima dan kembalian otomatis.", icon: Banknote },
  { id: "QRIS", label: "QRIS", desc: "Pembayaran nontunai melalui kode QR.", icon: QrCode },
  { id: "TRANSFER", label: "Transfer", desc: "Pembayaran lewat transfer bank/e-wallet.", icon: CreditCard },
];

function buildInvoiceNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const time = now.toTimeString().slice(0, 8).replaceAll(":", "");
  return `PB-${date}-${time}`;
}

function normalizePhone(phone: string) {
  const cleaned = phone.replace(/[^0-9]/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("0")) return `62${cleaned.slice(1)}`;
  if (cleaned.startsWith("62")) return cleaned;
  return cleaned;
}

function getPaymentLabel(method: PaymentMethod) {
  if (method === "CASH") return "Cash";
  if (method === "QRIS") return "QRIS";
  return "Transfer";
}

function buildWhatsAppMessage(receipt: ReceiptData) {
  const items = receipt.items
    .map(
      (item, index) =>
        `${index + 1}. ${item.name}\n   ${item.qty} x ${formatCurrency(item.price)} = ${formatCurrency(
          item.price * item.qty
        )}`
    )
    .join("\n");

  return [
    "*Beard Papa's - Receipt*",
    `No. Struk: ${receipt.invoice}`,
    `Tanggal: ${receipt.date}`,
    `Customer: ${receipt.customerName}`,
    `No. HP: ${receipt.customerPhone}`,
    `Kasir: ${receipt.cashier}`,
    `Tipe Pesanan: ${receipt.orderType === "DINE_IN" ? "Dine In" : "Take Away"}`,
    receipt.orderType === "DINE_IN" && receipt.tableNumber ? `Meja: ${receipt.tableNumber}` : "",
    "",
    "*Daftar Pesanan*",
    items,
    "",
    `Total: *${formatCurrency(receipt.total)}*`,
    `Metode Bayar: ${getPaymentLabel(receipt.paymentMethod)}`,
    receipt.paymentMethod === "CASH"
      ? `Uang Diterima: ${formatCurrency(receipt.cashReceived)}\nKembalian: ${formatCurrency(receipt.change)}`
      : "Status: Lunas",
    receipt.note ? `Catatan: ${receipt.note}` : "",
    "",
    "Terima kasih sudah berbelanja di Beard Papa's.",
  ]
    .filter(Boolean)
    .join("\n");
}

function openReceiptPrint(receipt: ReceiptData) {
  const rows = receipt.items
    .map(
      (item) => `
        <tr>
          <td>${item.name}<br/><small>${item.qty} x ${formatCurrency(item.price)}</small></td>
          <td style="text-align:right;white-space:nowrap;">${formatCurrency(item.price * item.qty)}</td>
        </tr>
      `
    )
    .join("");

  const printWindow = window.open("", "_blank", "width=420,height=720");
  if (!printWindow) return;

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Struk ${receipt.invoice}</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 18px; font-family: Arial, sans-serif; color: #111; }
          .receipt { width: 320px; margin: 0 auto; }
          .center { text-align: center; }
          .brand { font-size: 22px; font-weight: 800; color: #102A6D; }
          .sub { color: #555; font-size: 12px; line-height: 1.45; }
          .line { border-top: 1px dashed #888; margin: 12px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          td { padding: 6px 0; vertical-align: top; }
          small { color: #555; }
          .total { font-size: 16px; font-weight: 800; }
          @media print { body { padding: 0; } .receipt { width: 100%; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="center">
            <div class="brand">Beard Papa's</div>
            <div class="sub">Fresh cream puff & desserts</div>
            <div class="sub">Struk Pembayaran</div>
          </div>
          <div class="line"></div>
          <table>
            <tr><td>No. Struk</td><td style="text-align:right;">${receipt.invoice}</td></tr>
            <tr><td>Tanggal</td><td style="text-align:right;">${receipt.date}</td></tr>
            <tr><td>Kasir</td><td style="text-align:right;">${receipt.cashier}</td></tr>
            <tr><td>Customer</td><td style="text-align:right;">${receipt.customerName}</td></tr>
            <tr><td>No. HP</td><td style="text-align:right;">${receipt.customerPhone}</td></tr>
          </table>
          <div class="line"></div>
          <table>${rows}</table>
          <div class="line"></div>
          <table>
            <tr class="total"><td>Total</td><td style="text-align:right;">${formatCurrency(receipt.total)}</td></tr>
            <tr><td>Metode</td><td style="text-align:right;">${getPaymentLabel(receipt.paymentMethod)}</td></tr>
            ${
              receipt.paymentMethod === "CASH"
                ? `<tr><td>Uang Diterima</td><td style="text-align:right;">${formatCurrency(receipt.cashReceived)}</td></tr>
                   <tr><td>Kembalian</td><td style="text-align:right;">${formatCurrency(receipt.change)}</td></tr>`
                : `<tr><td>Status</td><td style="text-align:right;">Lunas</td></tr>`
            }
          </table>
          ${receipt.note ? `<div class="line"></div><p class="sub"><b>Catatan:</b> ${receipt.note}</p>` : ""}
          <div class="line"></div>
          <p class="center sub">Terima kasih sudah berbelanja di Beard Papa's.</p>
        </div>
        <script>window.onload = function(){ window.print(); };</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function drawReceiptCanvas(receipt: ReceiptData) {
  const width = 900;
  const lineHeight = 30;
  const rowsHeight = receipt.items.length * 64;
  const height = 520 + rowsHeight + (receipt.note ? 70 : 0);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#102A6D";
  ctx.font = "bold 44px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Beard Papa's", width / 2, 70);
  ctx.fillStyle = "#555555";
  ctx.font = "22px Arial";
  ctx.fillText("Fresh cream puff & desserts", width / 2, 105);
  ctx.fillText("Struk Pembayaran", width / 2, 136);

  let y = 180;
  const drawLine = () => {
    ctx.strokeStyle = "#bbbbbb";
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(60, y);
    ctx.lineTo(width - 60, y);
    ctx.stroke();
    ctx.setLineDash([]);
    y += 34;
  };
  const drawKV = (label: string, value: string) => {
    ctx.textAlign = "left";
    ctx.fillStyle = "#555555";
    ctx.font = "22px Arial";
    ctx.fillText(label, 70, y);
    ctx.textAlign = "right";
    ctx.fillStyle = "#111111";
    ctx.font = "bold 22px Arial";
    ctx.fillText(value, width - 70, y);
    y += lineHeight;
  };

  drawLine();
  drawKV("No. Struk", receipt.invoice);
  drawKV("Tanggal", receipt.date);
  drawKV("Kasir", receipt.cashier);
  drawKV("Customer", receipt.customerName);
  drawKV("No. HP", receipt.customerPhone);
  drawKV("Tipe Pesanan", receipt.orderType === "DINE_IN" ? "Dine In" : "Take Away");
  if (receipt.orderType === "DINE_IN" && receipt.tableNumber) drawKV("Meja", receipt.tableNumber);
  drawLine();

  receipt.items.forEach((item) => {
    ctx.textAlign = "left";
    ctx.fillStyle = "#111111";
    ctx.font = "bold 23px Arial";
    ctx.fillText(item.name.slice(0, 34), 70, y);
    ctx.fillStyle = "#555555";
    ctx.font = "20px Arial";
    ctx.fillText(`${item.qty} x ${formatCurrency(item.price)}`, 70, y + 28);
    ctx.textAlign = "right";
    ctx.fillStyle = "#102A6D";
    ctx.font = "bold 22px Arial";
    ctx.fillText(formatCurrency(item.price * item.qty), width - 70, y + 14);
    y += 64;
  });

  drawLine();
  drawKV("Total", formatCurrency(receipt.total));
  drawKV("Metode", getPaymentLabel(receipt.paymentMethod));
  if (receipt.paymentMethod === "CASH") {
    drawKV("Uang Diterima", formatCurrency(receipt.cashReceived));
    drawKV("Kembalian", formatCurrency(receipt.change));
  } else {
    drawKV("Status", "Lunas");
  }

  if (receipt.note) {
    drawLine();
    ctx.textAlign = "left";
    ctx.fillStyle = "#555555";
    ctx.font = "20px Arial";
    ctx.fillText(`Catatan: ${receipt.note.slice(0, 70)}`, 70, y);
    y += 32;
  }

  drawLine();
  ctx.textAlign = "center";
  ctx.fillStyle = "#555555";
  ctx.font = "22px Arial";
  ctx.fillText("Terima kasih sudah berbelanja di Beard Papa's.", width / 2, y + 10);
  return canvas;
}

async function downloadReceiptImage(receipt: ReceiptData) {
  const canvas = drawReceiptCanvas(receipt);
  if (!canvas) return;

  await new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${receipt.invoice}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      resolve();
    }, "image/png", 0.95);
  });
}

async function shareReceiptImage(receipt: ReceiptData) {
  const canvas = drawReceiptCanvas(receipt);
  if (!canvas) return false;

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
  if (!blob) return false;

  const file = new File([blob], `${receipt.invoice}.png`, { type: "image/png" });
  const shareData = {
    title: "Struk Beard Papa's",
    text: `Struk ${receipt.invoice}`,
    files: [file],
  };

  const canShareFiles = typeof navigator !== "undefined" && "canShare" in navigator && navigator.canShare?.(shareData);
  if (canShareFiles && navigator.share) {
    await navigator.share(shareData);
    return true;
  }

  return false;
}


type POSCartPanelProps = {
  compact?: boolean;
  cart: CartItem[];
  totalQty: number;
  total: number;
  cashierName: string;
  customerName: string;
  customerPhone: string;
  note: string;
  orderType: OrderType;
  tableNumber: string;
  onCashierNameChange: (value: string) => void;
  onCustomerNameChange: (value: string) => void;
  onCustomerPhoneChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onOrderTypeChange: (value: OrderType) => void;
  onTableNumberChange: (value: string) => void;
  onChangeQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onOpenPayment: () => void;
};

function CartPanel({
  compact = false,
  cart,
  totalQty,
  total,
  cashierName,
  customerName,
  customerPhone,
  note,
  orderType,
  tableNumber,
  onCashierNameChange,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onNoteChange,
  onOrderTypeChange,
  onTableNumberChange,
  onChangeQty,
  onRemoveItem,
  onOpenPayment,
}: POSCartPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-white/10 p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="text-accent" size={20} />
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold leading-tight text-white sm:text-xl">Keranjang POS</h2>
            <p className="text-xs text-white/40">{cart.length} jenis item, {totalQty} pcs</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4">
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold text-white/55"><UserRoundCheck size={13} className="text-accent" /> Nama Kasir</span>
              <input value={cashierName} onChange={(event) => onCashierNameChange(event.target.value)} placeholder="Contoh: Siska" className="min-h-10 w-full rounded-xl border border-white/10 bg-dark/60 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent/60" />
            </label>
            <label className="block">
              <span className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold text-white/55"><User size={13} className="text-accent" /> Nama Pemesan</span>
              <input value={customerName} onChange={(event) => onCustomerNameChange(event.target.value)} placeholder="Contoh: Budi" className="min-h-10 w-full rounded-xl border border-white/10 bg-dark/60 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent/60" />
            </label>
            <label className="block sm:col-span-2 xl:col-span-1">
              <span className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold text-white/55"><Phone size={13} className="text-accent" /> No. HP / WhatsApp</span>
              <input value={customerPhone} onChange={(event) => onCustomerPhoneChange(event.target.value)} placeholder="08xxxxxxxxxx" className="min-h-10 w-full rounded-xl border border-white/10 bg-dark/60 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent/60" />
            </label>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-white/55">Tipe Pesanan</p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {[
                { id: "TAKE_AWAY", label: "Take Away", desc: "Customer ambil sendiri di counter." },
                { id: "DINE_IN", label: "Dine In", desc: "Pesanan untuk makan di tempat." },
              ].map((option) => {
                const selected = orderType === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onOrderTypeChange(option.id as OrderType)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-all active:scale-95 ${selected ? "border-accent bg-accent text-dark" : "border-white/10 bg-dark/60 text-white/65 hover:border-accent/60 hover:text-accent"}`}
                  >
                    <span className="block font-bold">{option.label}</span>
                    <span className={`mt-0.5 block text-[11px] leading-4 ${selected ? "text-dark/60" : "text-white/35"}`}>{option.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {orderType === "DINE_IN" && (
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-white/55">Nomor Meja</span>
              <input value={tableNumber} onChange={(event) => onTableNumberChange(event.target.value)} placeholder="Contoh: A12 / 05" className="min-h-10 w-full rounded-xl border border-white/10 bg-dark/60 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent/60" />
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold text-white/55"><StickyNote size={13} className="text-accent" /> Catatan Pesanan</span>
            <textarea value={note} onChange={(event) => onNoteChange(event.target.value)} rows={compact ? 2 : 2} placeholder="Contoh: tanpa gula tambahan, ambil jam 15.00" className="w-full resize-none rounded-xl border border-white/10 bg-dark/60 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent/60" />
          </label>

          <div className="border-t border-white/10 pt-3">
            {cart.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-white/40">Keranjang masih kosong. Pilih produk dari daftar menu.</div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-dark/45 p-3">
                    <div className="flex gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-cream"><img src={item.image} alt={item.name} className="h-full w-full object-contain p-1" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-bold text-white">{item.name}</p>
                        <p className="mt-1 text-xs text-white/40">{formatCurrency(item.price)}</p>
                      </div>
                      <button type="button" onClick={() => onRemoveItem(item.id)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-300 hover:bg-red-500/20"><Trash2 size={14} /></button>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center rounded-xl border border-white/10 bg-surface">
                        <button type="button" onClick={() => onChangeQty(item.id, -1)} className="flex h-9 w-9 items-center justify-center text-white/60 hover:text-accent"><Minus size={14} /></button>
                        <span className="min-w-8 text-center text-sm font-bold text-white">{item.qty}</span>
                        <button type="button" onClick={() => onChangeQty(item.id, 1)} className="flex h-9 w-9 items-center justify-center text-white/60 hover:text-accent"><Plus size={14} /></button>
                      </div>
                      <p className="text-sm font-bold text-accent">{formatCurrency(item.price * item.qty)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-white/10 p-3 sm:p-4">
        <div className="mb-3 rounded-2xl border border-accent/20 bg-accent/10 p-3">
          <div className="flex justify-between gap-4 text-xs text-white/60"><span>Total Item</span><span>{totalQty} pcs</span></div>
          <div className="mt-1.5 flex items-end justify-between gap-4"><span className="text-sm font-semibold text-white/65">Total Harga</span><span className="text-lg font-bold text-accent">{formatCurrency(total)}</span></div>
        </div>
        <button type="button" disabled={cart.length === 0} onClick={onOpenPayment} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-sm font-bold text-dark shadow-lg shadow-accent/20 transition-all hover:bg-cream active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"><Receipt size={17} /> Bayar & Buat Struk</button>
      </div>
    </div>
  );
}


export default function POS() {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menuProducts, setMenuProducts] = useState<PublicProduct[]>(PUBLIC_PRODUCTS);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>("all");
  const [cashierName, setCashierName] = useState(user?.name || "");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("TAKE_AWAY");
  const [tableNumber, setTableNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [cashReceived, setCashReceived] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [toast, setToast] = useState({ open: false, tone: "info" as "success" | "error" | "info", title: "", message: "" });

  const products = useMemo(() => {
    return menuProducts.filter((product) => {
      const matchesCategory = activeCategory === "all" || product.category === activeCategory;
      const matchesQuery = `${product.name} ${product.desc} ${product.tag} ${product.categoryLabel}`
        .toLowerCase()
        .includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query, menuProducts]);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const paidAmount = Number(cashReceived || 0);
  const changeAmount = Math.max(0, paidAmount - total);

  useEffect(() => {
    getPublicProducts().then(setMenuProducts);
  }, []);

  const showToast = (tone: "success" | "error" | "info", title: string, message: string) => {
    setToast({ open: true, tone, title, message });
    window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 2600);
  };

  const addProduct = (product: PublicProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) return prev.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
      return [...prev, { ...product, qty: 1 }];
    });
    showToast("success", "Produk ditambahkan", `${product.name} masuk ke keranjang POS.`);
  };

  const changeQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item)).filter((item) => item.qty > 0));
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((item) => item.id !== id));

  const openPayment = () => {
    if (cart.length === 0) return showToast("error", "Keranjang kosong", "Tambahkan produk terlebih dahulu sebelum pembayaran.");
    if (!cashierName.trim()) return showToast("error", "Nama kasir wajib diisi", "Isi nama kasir agar struk lebih lengkap.");
    if (!customerName.trim()) return showToast("error", "Nama customer wajib diisi", "Isi nama pemesan agar struk lebih rapi.");
    if (!customerPhone.trim()) return showToast("error", "Nomor HP wajib diisi", "Isi nomor HP untuk kebutuhan kirim struk WhatsApp.");
    if (orderType === "DINE_IN" && !tableNumber.trim()) return showToast("error", "Nomor meja wajib diisi", "Isi nomor meja untuk transaksi dine in.");
    setCartOpen(false);
    setPaymentOpen(true);
  };

  const completePayment = async () => {
    if (paymentMethod === "CASH" && paidAmount < total) {
      showToast("error", "Uang diterima kurang", "Nominal cash harus sama atau lebih besar dari total belanja.");
      return;
    }

    let completedReceipt: ReceiptData = {
      invoice: buildInvoiceNumber(),
      date: new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }),
      cashier: cashierName.trim(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      note: note.trim(),
      orderType,
      tableNumber: orderType === "DINE_IN" ? tableNumber.trim() : undefined,
      paymentMethod,
      items: cart,
      total,
      cashReceived: paymentMethod === "CASH" ? paidAmount : total,
      change: paymentMethod === "CASH" ? changeAmount : 0,
    };

    try {
      const transaction = await createOfflineTransaction({
        items: cart.map((item) => ({ productId: item.id, quantity: item.qty })),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        orderType,
        tableNumber: orderType === "DINE_IN" ? tableNumber.trim() : null,
        notes: note.trim(),
        paymentMethod,
        cashReceived: paymentMethod === "CASH" ? paidAmount : null,
        referenceNumber: paymentMethod === "CASH" ? null : buildInvoiceNumber(),
      });

      completedReceipt = {
        ...completedReceipt,
        invoice: transaction.receiptNumber || transaction.invoiceNumber || transaction.id,
        date: new Date(transaction.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }),
        items: transaction.items.map((item) => ({
          id: item.productId,
          name: item.name,
          price: item.price,
          image: item.image || "",
          tag: "Fresh",
          desc: item.name,
          category: "shell",
          categoryLabel: "Menu",
          qty: item.qty,
        })),
        total: transaction.total,
      };
    } catch {
      // Fallback lokal tetap dipakai supaya POS tidak berhenti jika BE belum aktif.
    }

    setReceipt(completedReceipt);
    setCart([]);
    setPaymentOpen(false);
    setReceiptOpen(true);
    setCashReceived("");
    showToast("success", "Pembayaran berhasil", "Struk pembayaran sudah dibuat.");
  };

  const sendReceiptToWhatsApp = () => {
    if (!receipt) return;
    const phone = normalizePhone(receipt.customerPhone);
    if (!phone) return showToast("error", "Nomor HP tidak valid", "Periksa kembali nomor HP customer.");
    const message = encodeURIComponent(buildWhatsAppMessage(receipt));
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank", "noopener,noreferrer");
  };

  const handleShareImage = async () => {
    if (!receipt) return;
    const shared = await shareReceiptImage(receipt);
    if (!shared) {
      await downloadReceiptImage(receipt);
      showToast("info", "Foto struk diunduh", "Browser ini belum bisa share file langsung. Kirim PNG struk secara manual lewat WhatsApp.");
    }
  };



  return (
    <div className="flex h-dvh overflow-hidden bg-dark">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-hidden">
        <div className="grid h-dvh min-w-0 gap-0 overflow-hidden xl:grid-cols-[minmax(0,1fr)_400px]">
          <section className="h-dvh min-w-0 overflow-y-auto overflow-x-hidden px-4 pb-28 pt-20 sm:px-5 lg:px-6 lg:py-6 xl:pb-8 xl:pr-5">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">Kasir Beard Papa's</p>
                <h1 className="mt-1 font-display text-3xl font-bold text-white">Point of Sale</h1>
                <p className="mt-2 max-w-2xl text-sm text-white/50">Pilih menu, isi data customer, pilih metode pembayaran, lalu cetak atau kirim struk.</p>
              </div>
            </div>

            <div className="mb-5 space-y-3">
              <div className="relative min-w-0"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari menu POS..." className="min-h-12 w-full rounded-2xl border border-white/10 bg-surface px-11 py-3 text-sm text-white outline-none transition-all placeholder:text-white/35 focus:border-accent/70 focus:ring-2 focus:ring-accent/20" /></div>
              <div className="responsive-scroll-x -mx-1 px-1 pb-1"><div className="flex min-w-max gap-2">
                {PUBLIC_PRODUCT_CATEGORIES.map((category) => {
                  const isActive = activeCategory === category.id;
                  return <button key={category.id} type="button" onClick={() => setActiveCategory(category.id)} className={`rounded-2xl border px-4 py-2.5 text-left text-xs font-bold transition-all active:scale-95 ${isActive ? "border-accent bg-accent text-dark shadow-lg shadow-accent/20" : "border-white/10 bg-surface text-white/65 hover:border-accent/60 hover:text-accent"}`}><span className="block whitespace-nowrap">{category.title}</span></button>;
                })}
              </div></div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
              {products.map((product, index) => (
                <motion.button key={product.id} type="button" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.025 }} whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }} onClick={() => addProduct(product)} className="group min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-surface text-left shadow-xl shadow-black/15 transition-all hover:border-accent/60 hover:shadow-accent/10">
                  <div className="relative h-32 bg-cream sm:h-40"><img src={product.image} alt={product.name} width="420" height="420" loading={index < 4 ? "eager" : "lazy"} decoding="async" className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105" /><span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-white shadow-lg">{product.tag}</span></div>
                  <div className="p-3 sm:p-4"><p className="line-clamp-2 min-h-10 text-sm font-bold text-white">{product.name}</p><p className="mt-1 text-xs text-white/40">{product.categoryLabel}</p><p className="mt-2 text-sm font-bold text-accent">{formatCurrency(product.price)}</p></div>
                </motion.button>
              ))}
            </div>
          </section>

          <aside className="hidden h-dvh min-w-0 border-l-4 border-accent/80 bg-surface xl:block"><div className="flex h-dvh min-h-0 flex-col overflow-hidden"><CartPanel cart={cart}
                  totalQty={totalQty}
                  total={total}
                  cashierName={cashierName}
                  customerName={customerName}
                  customerPhone={customerPhone}
                  note={note}
                  orderType={orderType}
                  tableNumber={tableNumber}
                  onCashierNameChange={setCashierName}
                  onCustomerNameChange={setCustomerName}
                  onCustomerPhoneChange={setCustomerPhone}
                  onNoteChange={setNote}
                  onOrderTypeChange={setOrderType}
                  onTableNumberChange={setTableNumber}
                  onChangeQty={changeQty}
                  onRemoveItem={removeItem}
                  onOpenPayment={openPayment} /></div></aside>
        </div>
      </main>

      <button type="button" onClick={() => setCartOpen(true)} className="fixed bottom-5 right-5 z-[65] flex min-h-14 min-w-14 items-center justify-center rounded-2xl bg-accent text-dark shadow-2xl shadow-black/40 ring-1 ring-white/10 xl:hidden">
        <ShoppingCart size={24} />
        {totalQty > 0 && <span className="absolute -right-2 -top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-white">{totalQty}</span>}
      </button>

      <Modal open={cartOpen} onClose={() => setCartOpen(false)} title="Keranjang POS" size="xl"><div className="-m-4 max-h-[78dvh] sm:-m-5"><CartPanel compact cart={cart}
                  totalQty={totalQty}
                  total={total}
                  cashierName={cashierName}
                  customerName={customerName}
                  customerPhone={customerPhone}
                  note={note}
                  orderType={orderType}
                  tableNumber={tableNumber}
                  onCashierNameChange={setCashierName}
                  onCustomerNameChange={setCustomerName}
                  onCustomerPhoneChange={setCustomerPhone}
                  onNoteChange={setNote}
                  onOrderTypeChange={setOrderType}
                  onTableNumberChange={setTableNumber}
                  onChangeQty={changeQty}
                  onRemoveItem={removeItem}
                  onOpenPayment={openPayment} /></div></Modal>

      <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Pembayaran POS" size="lg">
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-dark/45 p-4"><div className="flex justify-between gap-4 text-sm text-white/55"><span>Total Pembayaran</span><span>{totalQty} item</span></div><p className="mt-2 text-3xl font-bold text-accent">{formatCurrency(total)}</p></div>
          <div><p className="mb-3 text-sm font-semibold text-white">Pilih Metode Pembayaran</p><div className="grid gap-3 sm:grid-cols-3">{paymentOptions.map((option) => { const Icon = option.icon; const selected = paymentMethod === option.id; return <button key={option.id} type="button" onClick={() => setPaymentMethod(option.id)} className={`rounded-2xl border p-4 text-left transition-all active:scale-95 ${selected ? "border-accent bg-accent text-dark shadow-lg shadow-accent/20" : "border-white/10 bg-dark/45 text-white hover:border-accent/60"}`}><Icon size={22} className={selected ? "text-dark" : "text-accent"} /><p className="mt-3 font-bold">{option.label}</p><p className={`mt-1 text-xs leading-5 ${selected ? "text-dark/65" : "text-white/40"}`}>{option.desc}</p></button>; })}</div></div>
          {paymentMethod === "CASH" && <div className="rounded-2xl border border-white/10 bg-dark/45 p-4"><label className="block"><span className="mb-2 block text-sm font-semibold text-white">Uang Diterima</span><input value={cashReceived} onChange={(event) => setCashReceived(event.target.value.replace(/[^0-9]/g, ""))} placeholder="Masukkan nominal cash" inputMode="numeric" className="min-h-12 w-full rounded-xl border border-white/10 bg-surface px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-accent/60" /></label><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-surface p-3"><p className="text-xs text-white/40">Total</p><p className="mt-1 font-bold text-white">{formatCurrency(total)}</p></div><div className="rounded-xl bg-surface p-3"><p className="text-xs text-white/40">Kembalian</p><p className="mt-1 font-bold text-accent">{formatCurrency(changeAmount)}</p></div></div></div>}
          {paymentMethod !== "CASH" && <div className="rounded-2xl border border-mint/20 bg-mint/10 p-4 text-sm text-white/65">Untuk dummy FE, pembayaran {getPaymentLabel(paymentMethod)} dianggap lunas ketika kasir menekan tombol konfirmasi. Nanti saat backend aktif, status bisa divalidasi dari payment gateway atau bukti transfer.</div>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setPaymentOpen(false)} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white/65 transition-colors hover:border-white/25 hover:text-white">Batal</button><button type="button" onClick={completePayment} className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-dark shadow-lg shadow-accent/20 transition-colors hover:bg-cream">Konfirmasi Pembayaran</button></div>
        </div>
      </Modal>

      <Modal open={receiptOpen && !!receipt} onClose={() => setReceiptOpen(false)} title="Pembayaran Berhasil" size="lg">
        {receipt && <div className="space-y-5"><div className="rounded-2xl border border-emerald-400/20 bg-emerald-950/30 p-4"><p className="text-sm font-semibold text-emerald-200">Transaksi berhasil diselesaikan.</p><p className="mt-1 text-xs text-white/45">WhatsApp browser hanya bisa mengirim teks otomatis. Untuk foto struk, gunakan tombol bagikan/download PNG.</p></div>
          <div className="rounded-3xl border border-white/10 bg-dark p-5"><div className="text-center"><p className="font-display text-2xl font-bold text-accent">Beard Papa's</p><p className="mt-1 text-xs text-white/45">Fresh cream puff & desserts</p></div><div className="my-4 border-t border-dashed border-white/20" /><div className="grid gap-2 text-sm text-white/65 sm:grid-cols-2"><p><span className="text-white/35">No. Struk:</span> {receipt.invoice}</p><p><span className="text-white/35">Tanggal:</span> {receipt.date}</p><p><span className="text-white/35">Customer:</span> {receipt.customerName}</p><p><span className="text-white/35">No. HP:</span> {receipt.customerPhone}</p><p><span className="text-white/35">Kasir:</span> {receipt.cashier}</p><p><span className="text-white/35">Metode:</span> {getPaymentLabel(receipt.paymentMethod)}</p><p><span className="text-white/35">Tipe:</span> {receipt.orderType === "DINE_IN" ? "Dine In" : "Take Away"}</p>{receipt.orderType === "DINE_IN" && receipt.tableNumber && <p><span className="text-white/35">Meja:</span> {receipt.tableNumber}</p>}</div><div className="my-4 border-t border-dashed border-white/20" /><div className="space-y-3">{receipt.items.map((item) => <div key={item.id} className="flex gap-3 text-sm"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-cream"><img src={item.image} alt={item.name} className="h-full w-full object-contain p-1" /></div><div className="min-w-0 flex-1"><p className="font-bold text-white">{item.name}</p><p className="text-xs text-white/40">{item.qty} x {formatCurrency(item.price)}</p></div><p className="font-bold text-accent">{formatCurrency(item.price * item.qty)}</p></div>)}</div><div className="my-4 border-t border-dashed border-white/20" /><div className="space-y-2 text-sm"><div className="flex justify-between text-white/65"><span>Total</span><span className="font-bold text-white">{formatCurrency(receipt.total)}</span></div>{receipt.paymentMethod === "CASH" ? <><div className="flex justify-between text-white/65"><span>Uang Diterima</span><span>{formatCurrency(receipt.cashReceived)}</span></div><div className="flex justify-between text-white/65"><span>Kembalian</span><span>{formatCurrency(receipt.change)}</span></div></> : <div className="flex justify-between text-white/65"><span>Status</span><span>Lunas</span></div>}</div>{receipt.note && <div className="mt-4 rounded-2xl bg-surface p-3 text-sm text-white/60"><span className="font-semibold text-white">Catatan:</span> {receipt.note}</div>}</div>
          <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => openReceiptPrint(receipt)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white/75 transition-colors hover:border-accent hover:text-accent"><Printer size={17} /> Cetak Struk</button><button type="button" onClick={sendReceiptToWhatsApp} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-dark shadow-lg shadow-accent/20 transition-colors hover:bg-cream"><Send size={17} /> Kirim WA Teks</button><button type="button" onClick={() => downloadReceiptImage(receipt)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-accent/40 px-5 py-3 text-sm font-bold text-accent transition-colors hover:bg-accent hover:text-dark"><Camera size={17} /> Download Foto Struk</button><button type="button" onClick={handleShareImage} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-surface px-5 py-3 text-sm font-bold text-white/75 transition-colors hover:bg-white/10"><Send size={17} /> Bagikan Foto</button></div>
          <button type="button" onClick={() => { setReceiptOpen(false); setCustomerName(""); setCustomerPhone(""); setNote(""); setPaymentMethod("CASH"); setOrderType("TAKE_AWAY"); setTableNumber(""); }} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-surface px-5 py-3 text-sm font-bold text-white/70 transition-colors hover:bg-white/10"><X size={17} /> Transaksi Baru</button>
        </div>}
      </Modal>
      <Toast open={toast.open} tone={toast.tone} title={toast.title} message={toast.message} />
    </div>
  );
}
