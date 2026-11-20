import { Check, ChevronRight, CircleDot } from 'lucide-react'
import { pointLabel, statuses } from '@/lib/padel'
import type { Match } from '@/lib/padel'

function Tag({ status }: { status: string }) { return <span className={`tag ${status}`}><i />{statuses[status] || status}</span> }

export function ScoreCard({ court, match, tier, nextMatch, nextTier, queueCount = 0, onClick }: { court: string; match?: Match | null; tier?: string; nextMatch?: Match | null; nextTier?: string; queueCount?: number; onClick?: () => void }) {
  return <article className={`court-card ${match?.status || 'idle'} ${onClick ? 'clickable' : ''}`} onClick={onClick}>
    <header><span className="court-name"><CircleDot size={16} />{court}</span>{match ? <Tag status={match.status} /> : <span className="idle-label">Standby</span>}</header>
    {match ? <><div className="court-meta">{tier} <span>•</span> {match.group_name}</div>
      <div className="score-labels"><span>PASANGAN</span><span>SET</span><span>GAME</span><span>POIN</span></div>
      {[0, 1].map(team => <div className={`score-row ${match.state.winner === team ? 'winner' : ''}`} key={team}>
        <div className="team-name">{match.state.server % 2 === team && match.status !== 'finished' && <span className="serve-dot" title="Servis" />}{team === 0 ? match.team_a : match.team_b}{match.state.winner === team && <Check size={16} />}</div>
        <div className="set-scores">{match.state.sets.length ? match.state.sets.map((set, i) => <span className={set.winner === team ? 'set-won' : ''} key={i}>{set.kind === 'super' ? <small>{set.games[team]}</small> : set.games[team]}</span>) : '–'}</div>
        <strong className="game-score">{match.state.mode === 'super' || match.state.winner !== null ? '–' : match.state.games[team]}</strong>
        <strong className="point-score">{match.state.winner !== null ? (match.state.winner === team ? 'W' : '–') : pointLabel(match, team)}</strong>
      </div>)}
      <footer>{match.state.winner !== null ? 'Hasil akhir' : match.state.mode === 'super' ? 'SUPER TIE-BREAK' : match.state.mode === 'tiebreak' ? 'TIE-BREAK' : `SET ${match.state.sets.length + 1}`}<span>{match.rules.golden_point ? 'Golden point' : 'Advantage'}{onClick && <ChevronRight size={14} />}</span></footer>
    </> : <div className="court-idle"><CircleDot size={35} /><p>Menunggu pertandingan</p><small>Pertandingan berikutnya akan tampil di sini.</small></div>}
    <section className="court-next" aria-label="Pertandingan berikutnya"><div className="next-heading"><span>NEXT MATCH</span>{queueCount > 1 && <small>+{queueCount - 1} antrean</small>}</div>{nextMatch ? <><div className="next-teams"><span>{nextMatch.team_a}</span><small>vs</small><span>{nextMatch.team_b}</span></div><p className="next-meta">{nextTier} · {nextMatch.group_name}</p></> : <p className="next-empty">Belum ada pertandingan berikutnya</p>}</section>
  </article>
}
