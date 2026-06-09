import type { StaffDashboardData, StaffPeriod } from "../types/staff";

const baseRecentProductions = [
  {
    id: "PROD-STF-001",
    productId: "PRD001",
    productName: "Roti Coklat",
    quantity: 50,
    staffName: "Siti Rahayu",
    status: "SELESAI" as const,
    notes: "Produksi pagi untuk stok etalase dan pesanan online.",
    createdAt: "2026-06-07T07:30:00.000Z",
  },
  {
    id: "PROD-STF-002",
    productId: "PRD002",
    productName: "Roti Keju",
    quantity: 30,
    staffName: "Siti Rahayu",
    status: "SELESAI" as const,
    notes: "Produksi tambahan berdasarkan stok produk jadi.",
    createdAt: "2026-06-07T09:15:00.000Z",
  },
  {
    id: "PROD-STF-003",
    productId: "PRD003",
    productName: "Croissant Butter",
    quantity: 20,
    staffName: "Rina Kartika",
    status: "DIPROSES" as const,
    notes: "Adonan sedang proofing sebelum dipanggang.",
    createdAt: "2026-06-07T11:00:00.000Z",
  },
];

const baseMaterialAlerts = [
  {
    id: "MAT003",
    name: "Coklat Blok",
    stock: 2,
    minStock: 3,
    unit: "kg",
    status: "MENIPIS" as const,
    suggestedAction: "Siapkan restock sebelum produksi roti coklat berikutnya.",
  },
  {
    id: "MAT004",
    name: "Mentega",
    stock: 0,
    minStock: 2,
    unit: "kg",
    status: "HABIS" as const,
    suggestedAction: "Produksi produk berbahan mentega perlu ditahan sampai stok masuk.",
  },
  {
    id: "MAT002",
    name: "Gula Pasir",
    stock: 6,
    minStock: 4,
    unit: "kg",
    status: "AMAN" as const,
    suggestedAction: "Stok masih aman, tetap monitor pemakaian harian.",
  },
];

const baseRecipes = [
  {
    id: "RCP001",
    productId: "PRD001",
    productName: "Roti Coklat",
    materialCount: 4,
    estimatedOutput: 120,
    readiness: "MENIPIS" as const,
    note: "Coklat blok mendekati batas minimum.",
  },
  {
    id: "RCP002",
    productId: "PRD002",
    productName: "Roti Keju",
    materialCount: 4,
    estimatedOutput: 80,
    readiness: "AMAN" as const,
    note: "Seluruh bahan utama masih cukup.",
  },
  {
    id: "RCP003",
    productId: "PRD003",
    productName: "Croissant Butter",
    materialCount: 5,
    estimatedOutput: 0,
    readiness: "HABIS" as const,
    note: "Mentega habis, produksi belum bisa dilanjutkan.",
  },
];

const baseStockMovements = [
  {
    id: "SM-STF-001",
    itemName: "Tepung Terigu",
    type: "OUT" as const,
    quantity: 5,
    unit: "kg",
    description: "Pemakaian bahan untuk produksi roti coklat.",
    createdAt: "2026-06-07T07:31:00.000Z",
  },
  {
    id: "SM-STF-002",
    itemName: "Roti Coklat",
    type: "IN" as const,
    quantity: 50,
    unit: "pcs",
    description: "Produk jadi bertambah dari produksi pagi.",
    createdAt: "2026-06-07T07:32:00.000Z",
  },
  {
    id: "SM-STF-003",
    itemName: "Mentega",
    type: "ADJUSTMENT" as const,
    quantity: 0,
    unit: "kg",
    description: "Hasil cek fisik menunjukkan stok mentega habis.",
    createdAt: "2026-06-07T10:10:00.000Z",
  },
];

const baseQueue = [
  {
    id: "Q-001",
    productName: "Croissant Butter",
    targetQuantity: 20,
    priority: "TINGGI" as const,
    status: "DIPROSES" as const,
    dueTime: "13:00",
  },
  {
    id: "Q-002",
    productName: "Roti Coklat",
    targetQuantity: 40,
    priority: "NORMAL" as const,
    status: "TERJADWAL" as const,
    dueTime: "15:00",
  },
];

const makeStaffDashboard = (period: StaffPeriod): StaffDashboardData => {
  const multiplier = period === "today" ? 1 : period === "week" ? 5 : 18;

  return {
    period,
    summary: {
      todayProduction: period === "today" ? 100 : 100 * multiplier,
      activeRecipes: 3,
      materialAlerts: 2,
      stockMovementsToday: period === "today" ? 3 : 3 * multiplier,
      pendingProduction: 2,
      completedProduction: period === "today" ? 2 : 2 * multiplier,
    },
    productionTrend:
      period === "today"
        ? [
            { label: "07:00", quantity: 30 },
            { label: "09:00", quantity: 50 },
            { label: "11:00", quantity: 20 },
            { label: "13:00", quantity: 0 },
          ]
        : period === "week"
          ? [
              { label: "Sen", quantity: 90 },
              { label: "Sel", quantity: 110 },
              { label: "Rab", quantity: 75 },
              { label: "Kam", quantity: 140 },
              { label: "Jum", quantity: 125 },
              { label: "Sab", quantity: 160 },
              { label: "Min", quantity: 100 },
            ]
          : [
              { label: "M1", quantity: 520 },
              { label: "M2", quantity: 610 },
              { label: "M3", quantity: 690 },
              { label: "M4", quantity: 580 },
            ],
    productionByProduct: [
      { productName: "Roti Coklat", quantity: 50 * multiplier },
      { productName: "Roti Keju", quantity: 30 * multiplier },
      { productName: "Croissant", quantity: 20 * multiplier },
    ],
    recentProductions: baseRecentProductions,
    materialAlerts: baseMaterialAlerts,
    recipeOverviews: baseRecipes,
    stockMovements: baseStockMovements,
    productionQueue: baseQueue,
  };
};

export const mockStaffDashboardByPeriod: Record<StaffPeriod, StaffDashboardData> = {
  today: makeStaffDashboard("today"),
  week: makeStaffDashboard("week"),
  month: makeStaffDashboard("month"),
};
