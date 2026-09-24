'use client';
import { useStudio } from '@/lib/store';
export default function Loader() {
  const ready = useStudio((s) => s.ready);
  if (ready) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-10 grid place-items-center" aria-live="polite">
      <div className="sheet rounded-[8px] px-4 py-3 text-center">
        <p className="font-serif text-[15px]">Building the 3D models</p>
        <p className="text-[12.5px] text-mute">Hull, cargo system and the 7-cylinder engine are generated in your browser. This takes a few seconds.</p>
      </div>
    </div>
  );
}
