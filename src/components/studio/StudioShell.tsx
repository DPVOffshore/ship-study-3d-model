'use client';
import dynamic from 'next/dynamic';
import { Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { navState } from '@/lib/navstate';
import { partHref } from '@/lib/nav';
import { useStudio } from '@/lib/store';
import CyclePanel from '../physics/CyclePanel';
import CommandPalette from './CommandPalette';
import Loader from './Loader';
import RouteSync from './RouteSync';
import StudySheet from './StudySheet';
import SystemIndex from './SystemIndex';
import Tooltip from './Tooltip';
import TopBar from './TopBar';
import ViewPresets from './ViewPresets';

// WebGL is client-only; keep three.js out of the server bundle.
const Viewer = dynamic(() => import('../viewer/Viewer'), { ssr: false });

export default function StudioShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const mode = useStudio((s) => s.mode);
  const onPick = useCallback((id: string | null) => {
    const m = useStudio.getState().mode;
    navState.fly = false;
    if (id) router.replace(partHref(id, m), { scroll: false });
    else if (useStudio.getState().sel) router.replace(`/${m}/`, { scroll: false });
  }, [router]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-stage">
      <main className="absolute inset-0" aria-label="3D view">
        <Viewer onPick={onPick} />
      </main>
      <Suspense fallback={null}><RouteSync /></Suspense>
      <TopBar />
      <ViewPresets />
      <SystemIndex />
      <Suspense fallback={null}><StudySheet /></Suspense>
      {mode === 'engine' && <CyclePanel />}
      <Loader />
      <Tooltip />
      <p className="pointer-events-none fixed bottom-3 right-3 z-0 hidden text-[11.5px] text-ink-2/70 xl:block">Click a part to study it. Drag to orbit, right-drag to pan, scroll to zoom.</p>
      <Suspense fallback={null}>{children}</Suspense>
      <CommandPalette />
    </div>
  );
}
