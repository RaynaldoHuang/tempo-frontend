import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Check, Layers, Trophy, Pause, Play } from 'lucide-react'
import { statuses } from '@/lib/padel'
import type { BoardStanding, BoardKnockout, BoardKnockoutEntry } from '@/lib/padel'

export function TVStandingsSlider({ standings, knockouts, connection }: { standings: BoardStanding[]; knockouts: BoardKnockout[]; connection: ReactNode }) {
  const [pageSize, setPageSize] = useState(() => window.innerWidth > 900 ? (window.innerHeight <= 700 ? 2 : window.innerHeight <= 900 ? 3 : 4) : 4)
  useEffect(() => {
    const resize = () => setPageSize(window.innerWidth > 900 ? (window.innerHeight <= 700 ? 2 : window.innerHeight <= 900 ? 3 : 4) : 4)
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  const groupSlides = standings.flatMap(group => Array.from({ length: Math.ceil(group.rows.length / pageSize) }, (_, page) => ({ kind: 'group' as const, id: `${group.tier_id}:${group.group_name}:${pageSize}:${page}`, group, page, rows: group.rows.slice(page * pageSize, page * pageSize + pageSize), pages: Math.ceil(group.rows.length / pageSize) })))
  const matchesPerPage = pageSize === 2 ? 1 : 2
  const knockoutSlides = knockouts.flatMap(bracket => Array.from({ length: bracket.champion ? 1 : Math.ceil(bracket.entries.length / matchesPerPage) }, (_, page) => ({ kind: 'knockout' as const, id: `ko:${bracket.tier_id}:${bracket.champion ? 'champion' : bracket.round_name}:${matchesPerPage}:${page}`, bracket, page, entries: bracket.entries.slice(page * matchesPerPage, page * matchesPerPage + matchesPerPage), pages: bracket.champion ? 1 : Math.ceil(bracket.entries.length / matchesPerPage) })))
  const slides = [...groupSlides, ...knockoutSlides]
  const [activeId, setActiveId] = useState('')
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const index = Math.max(0, slides.findIndex(slide => slide.id === activeId))
  const current = slides[index]
  const keys = JSON.stringify(slides.map(slide => slide.id))
  const stopped = paused || hovered || focused
  useEffect(() => {
    const ids = JSON.parse(keys) as string[]
    if (ids.length < 2 || stopped) return
    const timer = setTimeout(() => setActiveId(ids[(Math.max(0, ids.indexOf(activeId)) + 1) % ids.length]), 8000)
    return () => clearTimeout(timer)
  }, [keys, activeId, stopped])
  function navigate(direction: number) {
    if (slides.length > 1) setActiveId(slides[(index + direction + slides.length) % slides.length].id)
  }
  return <article className="tv-standings" aria-roledescription="carousel" aria-label="Klasemen dan pertandingan knockout" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}>
    <header className="tv-standings-heading"><span>{current?.kind === 'knockout' ? <><Trophy />KNOCKOUT</> : <><Layers />KLASEMEN GRUP</>}</span><span className="tv-standings-status">{current?.kind === 'knockout' ? current.bracket.champion ? 'JUARA' : 'BABAK AKTIF' : 'SEMENTARA'}</span></header>
    {current?.kind === 'knockout' ? <section key={current.id} className="tv-standings-slide" aria-roledescription="slide" aria-label={`${index + 1} dari ${slides.length}`}><div className="tv-standings-title"><p>{current.bracket.tournament_name} · {current.bracket.tier_name}</p><div><h2>{current.bracket.champion ? 'Juara turnamen' : current.bracket.round_name}</h2>{current.pages > 1 && <span>{current.page + 1}/{current.pages}</span>}</div></div>{current.bracket.champion ? <div className="tv-ko-champion"><Trophy /><p>{current.bracket.champion}</p><span>{current.bracket.tier_name} · Pemenang final</span></div> : <div className="tv-ko-list">{current.entries.map((entry, entryIndex) => <KnockoutPairing key={entryIndex} entry={entry} number={current.page * matchesPerPage + entryIndex + 1} />)}</div>}<p className="tv-standings-note"><i />{current.bracket.champion ? 'Hasil final terkonfirmasi' : 'Pemenang maju setelah hasil dikonfirmasi'}</p></section> : current ? <section key={current.id} className="tv-standings-slide" aria-roledescription="slide" aria-label={`${index + 1} dari ${slides.length}`}><div className="tv-standings-title"><p title={current.group.tournament_name ?? ''}>{current.group.tournament_name} · {current.group.tier_name}</p><div><h2>{current.group.group_name}</h2>{current.pages > 1 && <span>{current.page + 1}/{current.pages}</span>}</div></div>
      <div className="tv-standings-table-wrap"><table className="tv-standings-table"><thead><tr><th scope="col">#</th><th scope="col">PASANGAN</th><th scope="col" title="Pertandingan dimainkan">M</th><th scope="col" title="Kemenangan">W</th><th scope="col" title="Selisih set">Δ S</th><th scope="col" title="Selisih game">Δ G</th></tr></thead><tbody>{current.rows.map((row, rowIndex) => { const rank = current.page * pageSize + rowIndex + 1; return <tr key={row.team} className={rank <= current.group.qualifiers ? 'tv-qualifying' : ''}><td><span className="tv-rank">{rank}</span></td><th scope="row" title={row.team}><span>{row.team}</span></th><td>{row.played}</td><td className="tv-wins">{row.wins}</td><td>{row.sets > 0 ? '+' : ''}{row.sets}</td><td>{row.games > 0 ? '+' : ''}{row.games}</td></tr> })}</tbody></table></div>
      <p className="tv-standings-note"><i />{current.group.confirmed ? `${current.group.qualifiers} teratas lolos knockout` : current.group.complete && current.group.unresolved ? 'Peringkat seri · menunggu penentuan panitia' : `${current.group.qualifiers} teratas calon peserta lolos`}</p>
    </section> : <div className="tv-standings-empty"><Layers /><h2>Menunggu kompetisi</h2><p>Klasemen grup dan pertandingan knockout tampil otomatis saat tersedia.</p></div>}
    <footer className="tv-standings-footer"><div className="tv-standings-connection">{connection}</div>{slides.length > 1 && <div className="tv-slider-controls"><button type="button" onClick={() => navigate(-1)} aria-label="Slide sebelumnya"><ChevronLeft /></button><span>{index + 1}<small>/{slides.length}</small></span><button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Lanjutkan slide otomatis' : 'Jeda slide otomatis'}>{paused ? <Play /> : <Pause />}</button><button type="button" onClick={() => navigate(1)} aria-label="Slide berikutnya"><ChevronRight /></button></div>}</footer>
    {slides.length > 1 && <div className="tv-slider-progress" aria-hidden="true"><span key={`${current.id}-${stopped}`} style={{ animationPlayState: stopped ? 'paused' : 'running' }} /></div>}
  </article>
}

function livePoint(entry: BoardKnockoutEntry, side: number) {
  if (entry.mode !== 'regular') return String(entry.points[side])
  const point = entry.points[side]
  const other = entry.points[1 - side]
  if (point >= 3 && other >= 3) return point > other ? 'AD' : '40'
  return ['0', '15', '30', '40'][Math.min(point, 3)]
}

function KnockoutPairing({ entry, number }: { entry: BoardKnockoutEntry; number: number }) {
  return <div className="tv-ko-match"><header><span>#{number} · {entry.bye ? 'Langsung maju' : entry.court_name ?? (entry.status === 'waiting' ? 'Menunggu pemenang' : 'Menunggu court')}</span><span className={entry.status === 'live' ? 'tv-ko-live' : ''}>{entry.bye ? 'BYE' : statuses[entry.status] ?? 'Menunggu'}</span></header>{[0, 1].map(side => { const team = side === 0 ? entry.team_a : entry.team_b; return <div className={`tv-ko-team ${team !== null && entry.winner === team ? 'tv-ko-winner' : ''}`} key={side}><span title={team ?? ''}>{team ?? (side === 0 ? entry.label_a : entry.label_b)}</span><div className="tv-ko-score">{entry.winner === team && team !== null && <Check />}<strong>{entry.sets.map(set => set[side]).join(' · ') || '–'}</strong>{['live', 'paused'].includes(entry.status) && <small>{entry.games[side]} / {livePoint(entry, side)}</small>}</div></div> })}</div>
}
