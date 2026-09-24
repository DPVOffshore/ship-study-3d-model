'use client';
import { useHover } from '@/lib/store';
export default function Tooltip() {
  const { label, x, y } = useHover();
  if (!label) return null;
  return (
    <div role="tooltip" className="pointer-events-none fixed z-50 max-w-[260px] rounded-[4px] bg-ink px-2 py-1 text-[12px] text-white shadow-sm"
      style={{ left: x + 14, top: y + 12 }}>{label}</div>
  );
}
