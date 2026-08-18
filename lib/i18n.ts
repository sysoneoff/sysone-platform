export const languages = [
  { code: "uz", label: "O‘zbek", short: "UZ", dir: "ltr" },
  { code: "en", label: "English", short: "EN", dir: "ltr" },
  { code: "ru", label: "Русский", short: "RU", dir: "ltr" },
  { code: "tr", label: "Türkçe", short: "TR", dir: "ltr" },
  { code: "ar", label: "العربية", short: "AR", dir: "rtl" }
] as const;

export const uiCopy = {
  uz: { start: "Loyiha boshlash", explore: "Mahsulotlarni ko‘rish", signIn: "Kirish", search: "Qidirish", language: "Til" },
  en: { start: "Start a project", explore: "Explore products", signIn: "Sign in", search: "Search", language: "Language" },
  ru: { start: "Начать проект", explore: "Продукты", signIn: "Войти", search: "Поиск", language: "Язык" },
  tr: { start: "Proje başlat", explore: "Ürünleri keşfet", signIn: "Giriş", search: "Ara", language: "Dil" },
  ar: { start: "ابدأ مشروعًا", explore: "استكشف المنتجات", signIn: "تسجيل الدخول", search: "بحث", language: "اللغة" }
} as const;
