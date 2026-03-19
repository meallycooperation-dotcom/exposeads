import { NavLink } from "react-router-dom"

type NavItem = {
  label: string
  path: string
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/" },
  { label: "Data Set", path: "/data-set" },
  { label: "Social Media Marketing", path: "/social-media" },
  { label: "SEO Optimization", path: "/seo-optimization" },
  { label: "Paid Advertising", path: "/paid-advertising" },
  { label: "Content Marketing", path: "/content-marketing" },
  { label: "Email Marketing", path: "/email-marketing" },
  { label: "Influencer Marketing", path: "/influencer-marketing" },
  { label: "Brand Identity", path: "/brand-identity" },
  { label: "Website Development", path: "/website-development" },
  { label: "Lead Generation", path: "/lead-generation" },
  { label: "Video Marketing", path: "/video-marketing" },
  { label: "Marketing Analytics", path: "/marketing-analytics" },
  { label: "Conversion Optimization", path: "/conversion-optimization" },
]

const Sidebar = () => {
  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-white">
      <div className="px-6 py-4 text-xl font-bold">Expose</div>
      <nav className="px-3 pb-6">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-black text-white"
                      : "text-gray-700 hover:bg-gray-100",
                  ].join(" ")
                }
              >
                <span className="truncate">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
