'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PiggyBank, CreditCard, PieChart, User } from 'lucide-react'

const NAV = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Savings', href: '/savings', icon: PiggyBank },
  { label: 'Loans', href: '/loans', icon: CreditCard },
  { label: 'Shares', href: '/shares', icon: PieChart },
  { label: 'Profile', href: '/profile', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-white border-t"
      style={{
        borderColor: 'var(--border)',
        height: 'var(--bottom-nav-height)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {NAV.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link key={href} href={href} className="flex flex-col items-center gap-0.5 px-4 py-2 transition-colors">
            <Icon
              size={22}
              strokeWidth={active ? 2.5 : 1.8}
              style={{ color: active ? 'var(--forest)' : '#9ca3af' }}
            />
            <span
              className="text-[10px] font-medium"
              style={{ color: active ? 'var(--forest)' : '#9ca3af' }}
            >
              {label}
            </span>
            {active && (
              <span
                className="absolute bottom-0 w-1 h-1 rounded-full"
                style={{ background: 'var(--forest)' }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
