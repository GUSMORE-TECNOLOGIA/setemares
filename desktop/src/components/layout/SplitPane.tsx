import { useRef, useState } from 'react';

type Props = { left: React.ReactNode; right: React.ReactNode };

export function SplitPane({ left, right }: Props) {
	const [leftWidth, setLeftWidth] = useState(55);
	const isDragging = useRef(false);
	
	const handleMouseMove = (e: MouseEvent) => {
		if (!isDragging.current) return;
		const container = (e.target as HTMLElement).closest('.split-container');
		if (!container) return;
		const rect = container.getBoundingClientRect();
		const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
		setLeftWidth(Math.min(75, Math.max(25, newWidth)));
	};
	
	return (
		<div 
			className="split-container relative grid gap-4" 
			style={{ 
				gridTemplateColumns: `${leftWidth}% 12px ${100 - leftWidth}%`,
				height: 'calc(100vh - 64px - 48px)'
			}}
			onMouseMove={handleMouseMove}
			onMouseUp={() => (isDragging.current = false)}
		>
			<div className="overflow-hidden">{left}</div>
			<div
				className="split-divider"
				onMouseDown={() => (isDragging.current = true)}
			/>
			<div className="overflow-hidden">{right}</div>
		</div>
	);
}