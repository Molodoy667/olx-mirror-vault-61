import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  BarChart,
  MessageCircle,
  Settings,
  Shield,
  FileText,
  DollarSign,
  Building
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Дашборд",
    icon: LayoutDashboard,
    href: "/admin"
  },
  {
    title: "Користувачі",
    icon: Users,
    href: "/admin/users"
  },
  {
    title: "Оголошення",
    icon: Package,
    href: "/admin/listings"
  },
  {
    title: "Тарифи",
    icon: DollarSign,
    href: "/admin/tariffs"
  },
  {
    title: "Верифікації",
    icon: Building,
    href: "/admin/business-verifications"
  },
  {
    title: "Аналітика",
    icon: BarChart,
    href: "/admin/analytics"
  },
  {
    title: "Повідомлення",
    icon: MessageCircle,
    href: "/admin/messages"
  },
  {
    title: "Модерація",
    icon: Shield,
    href: "/admin/moderation"
  },
  {
    title: "Звіти",
    icon: FileText,
    href: "/admin/reports"
  },
  {
    title: "Налаштування",
    icon: Settings,
    href: "/admin/settings"
  }
];

export function AdminSidebar() {
  return (
    <aside className="w-full lg:w-64 bg-card dark:bg-card/95 border-r border-border min-h-[calc(100vh-73px)]">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  end={item.href === '/admin'}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200",
                      "hover:bg-accent hover:shadow-sm hover:translate-x-1",
                      "group relative overflow-hidden",
                      isActive && "bg-gradient-to-r from-primary to-primary-dark text-white shadow-glow hover:shadow-elevated"
                    )
                  }
                >
                  <div className={cn(
                    "p-1.5 rounded-md",
                    "bg-background/50 group-hover:bg-background/80 transition-colors"
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium">{item.title}</span>
                  
                  {/* Active indicator */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}