import Link from 'next/link';

function NavItem({
	href,
	label,
	icon,
}: {
	href: string;
	label: string;
	icon: React.ReactNode;
}) {
	return (
		<Link
			href={href}
			className="flex items-center gap-3 rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
		>
			<span className="w-5 h-5 inline-flex items-center justify-center">
				{icon}
			</span>
			<span className="text-sm font-medium">{label}</span>
		</Link>
	);
}

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
			<aside className="w-64 border-r border-zinc-800 p-5">
				<div className="flex items-center gap-3 mb-6">
					<div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M4 13.5V6.8C4 5.80589 4.80589 5 5.8 5H18.2C19.1941 5 20 5.80589 20 6.8V13.5"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
							/>
							<path
								d="M7 20H17"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
							/>
							<path
								d="M7 20C6.44772 20 6 19.5523 6 19V15C6 14.4477 6.44772 14 7 14H17C17.5523 14 18 14.4477 18 15V19C18 19.5523 17.5523 20 17 20H7Z"
								stroke="currentColor"
								strokeWidth="2"
							/>
						</svg>
					</div>
					<div className="leading-tight">
						<div className="text-sm font-semibold">Work Dashboard</div>
						<div className="text-xs text-zinc-400">Operations console</div>
					</div>
				</div>

				<nav className="flex flex-col gap-1">
					<NavItem
						href="/dashboard/projects"
						label="Projects"
						icon={
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M4 7.5C4 6.11929 5.11929 5 6.5 5H20"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
								/>
								<path
									d="M20 5V20.5C20 21.3284 19.3284 22 18.5 22H6.5C5.11929 22 4 20.8807 4 19.5V7.5Z"
									stroke="currentColor"
									strokeWidth="2"
								/>
							</svg>
						}
					/>
					<NavItem
						href="/dashboard/payments"
						label="Payments"
						icon={
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M3 10.5H21"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
								/>
								<path
									d="M6.5 15C6.22386 15.5522 6.22386 16.4478 6.5 17H17.5C17.7761 16.4478 17.7761 15.5522 17.5 15H6.5Z"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinejoin="round"
								/>
								<path
									d="M4.5 10.5V7.8C4.5 6.806 5.306 6 6.3 6H17.7C18.694 6 19.5 6.806 19.5 7.8V10.5"
									stroke="currentColor"
									strokeWidth="2"
								/>
							</svg>
						}
					/>
					<NavItem
						href="/dashboard/clients"
						label="Clients"
						icon={
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M20 21V19.2C20 18.0799 19.1046 17.2 18 17.2H6C4.89543 17.2 4 18.0799 4 19.2V21"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
								/>
								<path
									d="M12 13.2C14.2091 13.2 16 11.4091 16 9.2C16 6.99086 14.2091 5.2 12 5.2C9.79086 5.2 8 6.99086 8 9.2C8 11.4091 9.79086 13.2 12 13.2Z"
									stroke="currentColor"
									strokeWidth="2"
								/>
							</svg>
						}
					/>
					<NavItem
						href="/dashboard/bugs"
						label="Bugs"
						icon={
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M12 8C12.8954 8 13.5 7.34315 13.5 6.5C13.5 5.65685 12.8954 5 12 5C11.1046 5 10.5 5.65685 10.5 6.5C10.5 7.34315 11.1046 8 12 8Z"
									stroke="currentColor"
									strokeWidth="2"
								/>
								<path
									d="M9 10L7 12L9 14"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M15 10L17 12L15 14"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M8 20C8 18 9.5 16.5 11.5 16.5H12.5C14.5 16.5 16 18 16 20"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
								/>
							</svg>
						}
					/>
				</nav>
			</aside>

			<main className="flex-1 p-6">{children}</main>
		</div>
	);
}
