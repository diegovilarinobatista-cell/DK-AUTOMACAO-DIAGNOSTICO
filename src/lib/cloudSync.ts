import { useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';

type Kind = 'machine' | 'failure' | 'activity';
type WithId = { id: string };

interface Collections {
  machine: WithId[];
  failure: WithId[];
  activity: WithId[];
}

type SyncStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error' | 'offline';

const LOCAL_OWNER_KEY = 'dk_cache_owner';

function indexById(list: WithId[]) {
  const m = new Map<string, string>();
  for (const it of list) if (it && it.id) m.set(String(it.id), JSON.stringify(it));
  return m;
}

/**
 * Keeps machines/failures/activities in Supabase (table dk_records, RLS per user).
 * localStorage stays as an offline cache.
 */
export function useCloudSync(
  userId: string | null,
  data: Collections,
  setters: { machine: (v: any[]) => void; failure: (v: any[]) => void; activity: (v: any[]) => void },
) {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [hydrated, setHydrated] = useState(false);
  const snapshot = useRef<Record<Kind, Map<string, string>>>({
    machine: new Map(), failure: new Map(), activity: new Map(),
  });
  const timer = useRef<number | null>(null);

  // 1) Load from cloud on login
  useEffect(() => {
    if (!userId) { setHydrated(false); return; }
    let cancelled = false;
    (async () => {
      setStatus('loading');
      // Local cache belongs to another account → don't leak it into this one
      const cacheOwner = localStorage.getItem(LOCAL_OWNER_KEY);
      const localBelongsToUser = !cacheOwner || cacheOwner === userId;

      const { data: rows, error } = await supabase
        .from('dk_records').select('kind,id,data').in('kind', ['machine', 'failure', 'activity']);
      if (cancelled) return;
      if (error) { console.error(error); setStatus('error'); setHydrated(true); return; }

      if (rows && rows.length > 0) {
        const byKind: Collections = { machine: [], failure: [], activity: [] };
        for (const r of rows) (byKind as any)[r.kind]?.push(r.data);
        (['machine', 'failure', 'activity'] as Kind[]).forEach((k) => {
          setters[k](byKind[k]);
          snapshot.current[k] = indexById(byKind[k]);
        });
      } else if (!localBelongsToUser) {
        (['machine', 'failure', 'activity'] as Kind[]).forEach((k) => { setters[k]([]); snapshot.current[k] = new Map(); });
      } else {
        // First login: snapshot stays empty so local data gets uploaded by the save effect
        (['machine', 'failure', 'activity'] as Kind[]).forEach((k) => { snapshot.current[k] = new Map(); });
      }
      localStorage.setItem(LOCAL_OWNER_KEY, userId);
      setHydrated(true);
      setStatus('saved');
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // 2) Push diffs (debounced)
  useEffect(() => {
    if (!userId || !hydrated) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      const upserts: any[] = [];
      const deletes: { kind: Kind; ids: string[] }[] = [];
      const next: Record<Kind, Map<string, string>> = { machine: new Map(), failure: new Map(), activity: new Map() };
      (['machine', 'failure', 'activity'] as Kind[]).forEach((k) => {
        const cur = indexById(data[k]);
        next[k] = cur;
        const prev = snapshot.current[k];
        cur.forEach((json, id) => { if (prev.get(id) !== json) upserts.push({ owner: userId, kind: k, id, data: JSON.parse(json), updated_at: new Date().toISOString() }); });
        const removed = [...prev.keys()].filter((id) => !cur.has(id));
        if (removed.length) deletes.push({ kind: k, ids: removed });
      });
      if (!upserts.length && !deletes.length) return;
      if (!navigator.onLine) { setStatus('offline'); return; }
      setStatus('saving');
      try {
        if (upserts.length) {
          const { error } = await supabase.from('dk_records').upsert(upserts, { onConflict: 'owner,kind,id' });
          if (error) throw error;
        }
        for (const d of deletes) {
          const { error } = await supabase.from('dk_records').delete().eq('kind', d.kind).in('id', d.ids);
          if (error) throw error;
        }
        snapshot.current = next;
        setStatus('saved');
      } catch (e) {
        console.error('cloud sync failed', e);
        setStatus('error');
      }
    }, 800);
  }, [userId, hydrated, data.machine, data.failure, data.activity]);

  return { status, hydrated };
}
