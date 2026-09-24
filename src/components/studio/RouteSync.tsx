'use client';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { KB_BY_ID } from '@/lib/kb';
import { navState } from '@/lib/navstate';
import { runtime } from '@/lib/runtime';
import { useStudio, type Mode } from '@/lib/store';

/** The URL is the source of truth for mode and selected part. */
export default function RouteSync() {
  const pathname = usePathname();
  const params = useSearchParams();
  const part = params.get('part');
  const [, bump] = useState(0);

  useEffect(() => { const f = () => bump((n) => n + 1); runtime.listeners.add(f); return () => { runtime.listeners.delete(f); }; }, []);

  useEffect(() => {
    const st = useStudio.getState();
    const routeMode: Mode | null = pathname.startsWith('/engine') ? 'engine' : pathname.startsWith('/ship') ? 'ship' : null;
    const patch: Partial<ReturnType<typeof useStudio.getState>> = {};
    if (routeMode && routeMode !== st.mode) { patch.mode = routeMode; patch.iso = null; }
    const valid = part && KB_BY_ID[part] ? part : null;
    if (routeMode && valid !== st.sel) patch.sel = valid;
    if (Object.keys(patch).length) st.set(patch);
    if (routeMode && valid && ('sel' in patch || 'mode' in patch) && navState.fly) setTimeout(() => useStudio.getState().fly(), 30);
    navState.fly = true;
  }, [pathname, part]);

  return null;
}
