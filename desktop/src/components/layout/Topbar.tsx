import { Upload, FileDown, Play } from 'lucide-react';

export function Topbar() {
	return (
		<header className="glass-header h-16">
			<div className="max-w-7xl mx-auto px-6 xl:px-8 h-full flex items-center justify-between">
				<div>
					<h1 style={{ fontSize: 'clamp(22px, 2.2vw, 28px)', fontWeight: 700, letterSpacing: '-0.02em' }}>
						7Mares Cotador
					</h1>
					<p style={{ fontSize: 'clamp(14px, 1.2vw, 16px)', color: '#a0aec0', marginTop: '2px' }}>
						PNR → Cotação com RAV/Fee
					</p>
				</div>
				<div className="flex items-center gap-3">
					<button className="btn-modern btn-outline">
						<Upload size={18}/> Importar PNR
					</button>
					<button className="btn-modern btn-outline">
						<FileDown size={18}/> Exportar PDF
					</button>
					<button className="btn-modern btn-primary">
						<Play size={18}/> Gerar
					</button>
				</div>
			</div>
		</header>
	);
}