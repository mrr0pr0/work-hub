import Link from "next/link";


function NavItem({
    herf,
    label,
    icon,
}: {
    herf: string;
    label: string
    icon: React.ReactNode
}) {
    return (
        <Link
        href={herf}
        className="flex items-center gap-3 rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
    >
        <span className="w-5 h-5 inline-flex items-center justify-center">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
    </Link>
    )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return ( 
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
            <aside className="w-64 border-r border-zinc-800 p-5">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900 border-zinc-800 flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M4 13.5V6.8C4 5.80589 4.80589 5 5.8 5H18.2C19.1941 5 20 5.80589 20 6.8V13.5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                </div>
            </aside>
        </div>
    ) 
}