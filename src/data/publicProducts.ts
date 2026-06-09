import heroBakery from "../assets/bakery/hero-bakery.webp";
import originalCreamPuff from "../assets/menu/original.webp";
import chocolateEclair from "../assets/menu/chocolate-eclair.webp";
import greenTeaEclair from "../assets/menu/green-tea-eclair.webp";
import oreoEclair from "../assets/menu/oreo-cookie-crumble-eclair.webp";
import honeyButterEclair from "../assets/menu/honey-butter-eclair.webp";
import strawberryEclair from "../assets/menu/strawberry-eclair.webp";
import smoresEclair from "../assets/menu/smores-eclair.webp";
import ubeEclair from "../assets/menu/ube-eclair-seasonal.webp";
import vanillaFilledEclair from "../assets/menu/vanilla-filled-eclair.webp";
import greenTeaFilledEclair from "../assets/menu/green-tea-filled-eclair.webp";
import chocolateFilledEclair from "../assets/menu/chocolate-filled-eclair.webp";
import cremeBrulee from "../assets/menu/creme-brulee.webp";
import chocolateFondantCake from "../assets/menu/chocolate-fondant-cake.webp";
import japaneseCheesecake from "../assets/menu/japanese-cheesecake.webp";

export const HERO_BAKERY_IMAGE = heroBakery;

export type PublicProductCategory = "shell" | "filling" | "dessert";

export interface PublicProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  tag: string;
  desc: string;
  category: PublicProductCategory;
  categoryLabel: string;
}

export const PUBLIC_PRODUCT_CATEGORIES: {
  id: "all" | PublicProductCategory;
  title: string;
  subtitle: string;
}[] = [
  { id: "all", title: "Semua Menu", subtitle: "Shell, filling, dan dessert" },
  { id: "shell", title: "Step One: Choose Your Shell", subtitle: "Pilihan kulit cream puff dan eclair" },
  { id: "filling", title: "Step Two: Choose Your Filling", subtitle: "Pilihan filling cream puff" },
  { id: "dessert", title: "Desserts", subtitle: "Menu dessert tambahan" },
];

export const PUBLIC_PRODUCTS: PublicProduct[] = [
  {
    id: "shell-1",
    name: "Original Cream Puff",
    price: 28000,
    image: originalCreamPuff,
    tag: "Classic",
    desc: "Cream puff original dengan kulit ringan dan tekstur renyah lembut.",
    category: "shell",
    categoryLabel: "Choose Your Shell",
  },
  {
    id: "shell-2",
    name: "Chocolate Eclair",
    price: 32000,
    image: chocolateEclair,
    tag: "Chocolate",
    desc: "Eclair dengan lapisan coklat untuk rasa manis yang lebih kaya.",
    category: "shell",
    categoryLabel: "Choose Your Shell",
  },
  {
    id: "shell-3",
    name: "Green Tea Eclair",
    price: 32000,
    image: greenTeaEclair,
    tag: "Matcha",
    desc: "Eclair dengan karakter green tea yang ringan dan aromatik.",
    category: "shell",
    categoryLabel: "Choose Your Shell",
  },
  {
    id: "shell-4",
    name: "Oreo™ Cookie Crumble Eclair",
    price: 35000,
    image: oreoEclair,
    tag: "Crunchy",
    desc: "Eclair dengan topping cookie crumble untuk sensasi renyah.",
    category: "shell",
    categoryLabel: "Choose Your Shell",
  },
  {
    id: "shell-5",
    name: "Honey Butter Eclair",
    price: 34000,
    image: honeyButterEclair,
    tag: "Honey Butter",
    desc: "Eclair dengan sentuhan honey butter yang gurih dan manis.",
    category: "shell",
    categoryLabel: "Choose Your Shell",
  },
  {
    id: "shell-6",
    name: "Strawberry Eclair",
    price: 35000,
    image: strawberryEclair,
    tag: "Fruity",
    desc: "Eclair strawberry dengan nuansa buah yang segar.",
    category: "shell",
    categoryLabel: "Choose Your Shell",
  },
  {
    id: "shell-7",
    name: "S'mores Eclair",
    price: 36000,
    image: smoresEclair,
    tag: "Premium",
    desc: "Eclair s'mores dengan karakter coklat dan marshmallow.",
    category: "shell",
    categoryLabel: "Choose Your Shell",
  },
  {
    id: "shell-8",
    name: "Ube Eclair (Seasonal)",
    price: 36000,
    image: ubeEclair,
    tag: "Seasonal",
    desc: "Eclair ube musiman dengan warna dan rasa khas ubi ungu.",
    category: "shell",
    categoryLabel: "Choose Your Shell",
  },
  {
    id: "filling-1",
    name: "Vanilla Filled Eclair",
    price: 30000,
    image: vanillaFilledEclair,
    tag: "Vanilla",
    desc: "Filling vanilla custard yang lembut dan klasik.",
    category: "filling",
    categoryLabel: "Choose Your Filling",
  },
  {
    id: "filling-2",
    name: "Green Tea Filled Eclair",
    price: 32000,
    image: greenTeaFilledEclair,
    tag: "Green Tea",
    desc: "Filling green tea dengan rasa matcha yang halus.",
    category: "filling",
    categoryLabel: "Choose Your Filling",
  },
  {
    id: "filling-3",
    name: "Chocolate Filled Eclair",
    price: 32000,
    image: chocolateFilledEclair,
    tag: "Chocolate",
    desc: "Filling coklat creamy untuk penggemar rasa manis pekat.",
    category: "filling",
    categoryLabel: "Choose Your Filling",
  },
  {
    id: "dessert-1",
    name: "Creme Brulee",
    price: 38000,
    image: cremeBrulee,
    tag: "Dessert",
    desc: "Dessert lembut dengan lapisan karamel di bagian atas.",
    category: "dessert",
    categoryLabel: "Desserts",
  },
  {
    id: "dessert-2",
    name: "Chocolate Fondant Cake",
    price: 42000,
    image: chocolateFondantCake,
    tag: "Cake",
    desc: "Cake coklat lembut dengan rasa fondant yang intens.",
    category: "dessert",
    categoryLabel: "Desserts",
  },
  {
    id: "dessert-3",
    name: "Japanese Cheesecake",
    price: 40000,
    image: japaneseCheesecake,
    tag: "Cheesecake",
    desc: "Japanese cheesecake ringan, lembut, dan creamy.",
    category: "dessert",
    categoryLabel: "Desserts",
  },
];

export const FEATURED_PUBLIC_PRODUCTS = [
  PUBLIC_PRODUCTS[0],
  PUBLIC_PRODUCTS[1],
  PUBLIC_PRODUCTS[8],
];

export const PUBLIC_IMAGE_PRELOADS = [
  heroBakery,
  ...PUBLIC_PRODUCTS.map((product) => product.image),
];
