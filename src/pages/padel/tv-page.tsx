import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Fullscreen, Pause, Play } from 'lucide-react'
import { useLive } from '@/lib/padel'
import type { Board } from '@/lib/padel'
import { TempoLogo } from '@/components/shared/tempo-logo'
import { Connection } from '@/components/shared/padel-connection'
import { ScoreCard } from '@/components/shared/padel-score-card'
import { TVStandingsSlider } from './tv-standings-slider'
import './tv-fit.css'

function Brand() { return <div className="brand"><TempoLogo className="w-full" /></div> }

export default function TV() {
  const [params, setParams] = useSearchParams()
  const venue = params.get('venue') || ''
  const { data, error, updated } = useLive<Board>(venue ? `/board?venue_id=${encodeURIComponent(venue)}` : '/board', 1000)
  const [now, setNow] = useState(new Date())
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  const [page, setPage] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  const courts = data?.courts ?? Array.from({ length: 7 }, (_, i) => ({ id: i + 1, name: `Court ${i + 1}`, match: null, tier: null, next_match: null, next_tier: null, queue_count: 0 }))
  const showStandings = courts.length <= 7
  const cardCount = courts.length + (showStandings ? 1 : 0)
  const targetColumns = viewport.width < 600 ? 1 : viewport.width < 1000 ? 2 : viewport.width < 1200 ? 3 : 4
  const targetRows = viewport.width >= 600 && viewport.height >= 640 ? 2 : 1
  const columns = Math.min(targetColumns, Math.max(1, Math.ceil(cardCount / targetRows)))
  const rows = Math.min(targetRows, Math.max(1, Math.ceil(cardCount / columns)))
  const slots = columns * rows
  const pageCount = Math.max(1, Math.ceil(cardCount / slots))
  const currentPage = page % pageCount
  useEffect(() => {
    if (pageCount <= 1 || paused) return
    const timer = setTimeout(() => setPage(value => (value + 1) % pageCount), 10000)
    return () => clearTimeout(timer)
  }, [page, pageCount, paused])
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer) }, [])
  const ids = new Set(data?.courts.filter(c => c.match && c.match.status !== 'finished').map(c => c.tier?.tournament_id))
  const names = data?.tournaments.filter(t => ids.has(t.id)).map(t => t.name).join(' / ') || data?.tournaments[0]?.name || 'Tournament Live'
  return <div className="padel-live"><main className="tv-page tv-page-fit"><header className="tv-header"><Brand /><div className="tv-title"><h1 title={names}>{names}</h1>{(data?.venues?.length ?? 0) > 1 ? <select className="tv-venue-select" aria-label="Venue layar TV" value={data?.active_venue_id ?? venue} onChange={event => setParams(event.target.value ? { venue: event.target.value } : {})}>{data?.venues?.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select> : <p className="tv-active-venue">{data?.venues?.[0]?.name ?? 'Menunggu venue aktif'}</p>}</div><div className="tv-clock"><strong>{now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong><button className="icon-btn" aria-label="Layar penuh" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen().catch(() => {}) }}><Fullscreen size={20} /></button></div></header>
    {error && <div className="error-banner">Pembaruan terhenti. Skor terakhir tetap ditampilkan. Terakhir tersinkron: {updated ? new Date(updated).toLocaleTimeString('id-ID') : 'belum tersambung'}.</div>}
    {data?.active_venue_id === null ? <section className="tv-no-active-venue"><h2>Belum ada venue aktif</h2><p>Aktifkan venue melalui Master Data → Venue di panel admin.</p></section> : <div className="tv-grid tv-grid-fit" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>{courts.map((court, index) => <div className="tv-cell" key={court.id} hidden={Math.floor(index / slots) !== currentPage}><ScoreCard court={court.name} match={court.match} tier={court.tier?.name} nextMatch={court.next_match} nextTier={court.next_tier?.name} queueCount={court.queue_count} /></div>)}{showStandings && <div className="tv-cell" hidden={Math.floor(courts.length / slots) !== currentPage}><TVStandingsSlider standings={data?.standings ?? []} knockouts={data?.knockouts ?? []} connection={<Connection error={error} updated={updated} />} /></div>}</div>}<footer className="tv-footer">{pageCount > 1 && data?.active_venue_id !== null && <div className="tv-page-controls"><button type="button" aria-label="Halaman court sebelumnya" onClick={() => setPage((currentPage + pageCount - 1) % pageCount)}><ChevronLeft /></button><span>{currentPage + 1} / {pageCount}</span><button type="button" aria-label={paused ? 'Lanjutkan pergantian court' : 'Jeda pergantian court'} onClick={() => setPaused(value => !value)}>{paused ? <Play /> : <Pause />}</button><button type="button" aria-label="Halaman court berikutnya" onClick={() => setPage((currentPage + 1) % pageCount)}><ChevronRight /></button></div>}<span><i className="serve-dot" /> Penanda servis</span><span>TEMPO PADEL / LIVE TOURNAMENT SCORING</span><span>{now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span></footer></main></div>
}
