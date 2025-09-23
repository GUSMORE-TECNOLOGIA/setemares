import { Home, FileText, Database, BarChart3, Settings } from 'lucide-react';

export function Sidebar() {
	const items = [
		{ icon: <Home size={20} />, label: 'Decodificar', active: true },
		{ icon: <FileText size={20} />, label: 'Cotações' },
		{ icon: <Database size={20} />, label: 'Catálogo' },
		{ icon: <BarChart3 size={20} />, label: 'Relatórios' },
		{ icon: <Settings size={20} />, label: 'Config' },
	];
	
	return (
		<aside className="glass-sidebar w-64" style={{ minHeight: 'calc(100vh - 64px)' }}>
			<nav className="p-4 space-y-2">
				{items.map((item) => (
					<button key={item.label} className={`nav-item ${item.active ? 'active' : ''}`}>
						{item.icon}
						<span>{item.label}</span>
					</button>
				))}
			</nav>
		</aside>
	);
}