/**
 * Traducciones por locale para el panel del tenant (multi-idioma).
 * Las claves se usan en app-shell y en páginas del tenant.
 */

export type SupportedLocale = "es-AR" | "en" | "es";

const translations: Record<SupportedLocale, Record<string, string>> = {
  "es-AR": {
    dashboard: "Dashboard",
    menu: "Menú",
    operations: "Operaciones",
    locations: "Ubicaciones",
    lots: "Lotes",
    inventory: "Inventario",
    monitoring: "Monitoreo",
    devices: "Dispositivos",
    clubManagement: "Gestión del club",
    users: "Usuarios",
    members: "Socios",
    control: "Control",
    tickets: "Tickets",
    reports: "Reportes",
    revenue: "Ingresos",
    payments: "Pagos",
    cultivation: "Cultivo",
    products: "Productos",
    sales: "Ventas",
    compliance: "Compliance",
    admin: "Administración",
    suppliers: "Proveedores",
    supplies: "Suministros",
    stock: "Stock",
    strains: "Cepas",
    plants: "Plantas",
    controls: "Controles",
    myProfile: "Mi perfil",
    signOut: "Salir",
    backToPlatform: "Volver a Platform",
  },
  en: {
    dashboard: "Dashboard",
    menu: "Menu",
    operations: "Operations",
    locations: "Locations",
    lots: "Lots",
    inventory: "Inventory",
    monitoring: "Monitoring",
    devices: "Devices",
    clubManagement: "Club management",
    users: "Users",
    members: "Members",
    control: "Control",
    tickets: "Tickets",
    reports: "Reports",
    revenue: "Revenue",
    payments: "Payments",
    cultivation: "Cultivation",
    products: "Products",
    sales: "Sales",
    compliance: "Compliance",
    admin: "Administration",
    suppliers: "Suppliers",
    supplies: "Supplies",
    stock: "Stock",
    strains: "Strains",
    plants: "Plants",
    controls: "Controls",
    myProfile: "My profile",
    signOut: "Sign out",
    backToPlatform: "Back to Platform",
  },
  es: {
    dashboard: "Panel",
    menu: "Menú",
    operations: "Operaciones",
    locations: "Ubicaciones",
    lots: "Lotes",
    inventory: "Inventario",
    monitoring: "Monitoreo",
    devices: "Dispositivos",
    clubManagement: "Gestión del club",
    users: "Usuarios",
    members: "Socios",
    control: "Control",
    tickets: "Tickets",
    reports: "Reportes",
    revenue: "Ingresos",
    payments: "Pagos",
    cultivation: "Cultivo",
    products: "Productos",
    sales: "Ventas",
    compliance: "Compliance",
    admin: "Administración",
    suppliers: "Proveedores",
    supplies: "Suministros",
    stock: "Stock",
    strains: "Cepas",
    plants: "Plantas",
    controls: "Controles",
    myProfile: "Mi perfil",
    signOut: "Salir",
    backToPlatform: "Volver a Platform",
  },
};

function normalizeLocale(locale: string): SupportedLocale {
  const lower = locale.toLowerCase();
  if (lower.startsWith("en")) return "en";
  if (lower === "es-ar" || lower === "es_ar") return "es-AR";
  if (lower.startsWith("es")) return "es";
  return "es-AR";
}

/**
 * Devuelve las traducciones para el locale del tenant.
 * Uso: const t = getTranslations(tenant.locale); t("dashboard") => "Dashboard" o "Panel"
 */
export function getTranslations(locale: string | null | undefined): Record<string, string> {
  const key = normalizeLocale(locale ?? "es-AR");
  return translations[key] ?? translations["es-AR"];
}
