import { useEffect, useState } from 'react'
import { Fullscreen } from 'lucide-react'
import { useLive } from '@/lib/padel'
import type { Board } from '@/lib/padel'
import { TempoLogo } from '@/components/shared/tempo-logo'
import { Connection } from '@/components/shared/padel-connection'
import { ScoreCard } from '@/components/shared/padel-score-card'
import { TVStandingsSlider } from './tv-standings-slider'

function Brand() { return <div className="brand"><TempoLogo className="w-full" /></div> }

export default function TV() {
  const { data, error, updated } = useLive<Board>('/board', 1000)
  const [now, setNow] = useState(new Date())
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer) }, [])
  const ids = new Set(data?.courts.filter(c => c.match && c.match.status !== 'finished').map(c => c.tier?.tournament_id))
  const names = data?.tournaments.filter(t => ids.has(t.id)).map(t => t.name).join(' / ') || data?.tournaments[0]?.name || 'Tournament Live'
  return <div className="padel-live"><main className={`tv-page ${(data?.courts.length ?? 7) > 8 ? 'tv-page-many' : ''}`}><header className="tv-header"><Brand /><div className="tv-title"><h1>{names}</h1></div><div className="tv-clock"><strong>{now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong><button className="icon-btn" aria-label="Layar penuh" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen().catch(() => {}) }}><Fullscreen size={20} /></button></div></header>
    {error && <div className="error-banner">Pembaruan terhenti. Skor terakhir tetap ditampilkan. Terakhir tersinkron: {updated ? new Date(updated).toLocaleTimeString('id-ID') : 'belum tersambung'}.</div>}
    <div className={`tv-grid ${(data?.courts.length ?? 7) > 8 ? 'tv-grid-many' : ''}`}>{(data?.courts || Array.from({ length: 7 }, (_, i) => ({ id: i + 1, name: `Court ${i + 1}`, match: null, tier: null, next_match: null, next_tier: null, queue_count: 0 }))).map(c => <ScoreCard key={c.id} court={c.name} match={c.match} tier={c.tier?.name} nextMatch={c.next_match} nextTier={c.next_tier?.name} queueCount={c.queue_count} />)}{(data?.courts.length ?? 7) <= 7 && <TVStandingsSlider standings={data?.standings ?? []} knockouts={data?.knockouts ?? []} connection={<Connection error={error} updated={updated} />} />}</div><footer className="tv-footer"><span><i className="serve-dot" /> Penanda servis</span><span>TEMPO PADEL / LIVE TOURNAMENT SCORING</span><span>{now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span></footer></main></div>
}
