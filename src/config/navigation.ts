import { CircleDot, ClipboardList, GitBranch, Layers, LayoutDashboard, MapPin, Monitor, Settings, Settings2, ShieldCheck, Trophy, Users } from "lucide-react"

export const navigation = [
  {
    title: "Overview",
    items: [{ title: "Dashboard", href: "/admintempo/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Turnamen & Operasional",
    items: [
      { title: "Turnamen", href: "/admintempo/tournaments", icon: Trophy },
      { title: "Tier & grup", href: "/admintempo/tiers", icon: Layers },
      { title: "Penugasan wasit", href: "/admintempo/assignments", icon: ShieldCheck },
      { title: "Klasemen & knockout", href: "/admintempo/progression", icon: GitBranch },
      { title: "Jadwal & hasil", href: "/admintempo/matches", icon: ClipboardList },
      { title: "Layar TV", href: "/", icon: Monitor },
    ],
  },
  {
    title: "Master Data",
    items: [
      { title: "Venue", href: "/admintempo/master-data/venues", icon: MapPin },
      { title: "Court", href: "/admintempo/master-data/courts", icon: CircleDot },
      { title: "Wasit", href: "/admintempo/master-data/referees", icon: Users },
      { title: "Preset skor", href: "/admintempo/master-data/presets", icon: Settings2 },
    ],
  },
  {
    title: "System",
    items: [{ title: "Pengaturan akun", href: "/admintempo/account", icon: Settings }],
  },
]
