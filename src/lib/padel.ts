import { useCallback, useEffect, useState } from 'react'

export type Rules = { regular_sets: number; games_to_win: number; golden_point: boolean; deuce_rule?: 'advantage' | 'golden' | 'one_advantage'; tiebreak_at?: number | null; tiebreak_win_by_two?: boolean; tiebreak_points: number; super_points: number; super_win_by_two?: boolean }
export type User = { id: number; name: string; email: string; role: 'admin' | 'referee' }
export type Venue = { is_active: boolean; id: number; name: string }
export type Tournament = { venue_id: number | null; id: number; name: string; venue: string; date: string }
export type Tier = { edit_revision?: string; knockout?: { confirmed_at?: string; draw_mode?: 'ordered' | 'random' | 'seeded'; seeds?: string[] } | null; id: number; tournament_id: number; name: string; format: string; rules: Rules; groups: { name: string; teams: string[] }[] }
export type Preset = { id: number; name: string; rules: Rules }
export type Match = { reservation_id?: number; stage?: 'group' | 'knockout'; id: number; tier_id: number; court_id: number | null; queue_position: number | null; group_name: string; team_a: string; team_b: string; status: string; version: number; finished_at?: string | null; rules: Rules; state: { points: number[]; games: number[]; sets: { games: number[]; kind: string; winner: number }[]; mode: string; server: number; winner: number | null } }
export type Court = { venue_id: number | null; id: number; name: string; referee_id: number | null }
export type KnockoutFixture = { reservation_id: number | null; queue_position: number | null; version: number; tier_id: number; round: number; position: number; round_name: string; number: number; bye: boolean; team_a: string | null; team_b: string | null; label_a: string; label_b: string; court_id: number | null; revision: string }
export type Data = { knockout_schedule?: KnockoutFixture[]; venues: Venue[]; user: User; tournaments: Tournament[]; tiers: Tier[]; presets: Preset[]; referees: User[]; courts: Court[]; matches: Match[] }
export type BoardStanding = { tier_id: number; tier_name: string; tournament_name: string | null; group_name: string; qualifiers: number; confirmed: boolean; complete: boolean; unresolved: boolean; rows: { team: string; played: number; wins: number; sets: number; games: number }[] }
export type BoardKnockoutEntry = { team_a: string | null; team_b: string | null; label_a: string; label_b: string; winner: string | null; bye: boolean; status: string; court_name: string | null; sets: number[][]; points: number[]; games: number[]; mode: string }
export type BoardKnockout = { tier_id: number; tier_name: string; tournament_name: string | null; round_name: string; champion: string | null; entries: BoardKnockoutEntry[] }
export type Board = { active_venue_id?: number | null; venues?: Venue[]; knockouts?: BoardKnockout[]; standings?: BoardStanding[]; tournaments: Tournament[]; courts: { venue_id?: number | null; venue_name?: string | null; id: number; name: string; match: Match | null; tier: { name: string; tournament_id: number } | null; next_match: Match | null; next_tier: { name: string; tournament_id: number } | null; queue_count: number }[] }
export const defaults: Rules = { regular_sets: 2, games_to_win: 6, golden_point: false, tiebreak_points: 7, tiebreak_win_by_two: true, super_points: 10, super_win_by_two: true }
export const statuses: Record<string, string> = { waiting: 'Menunggu peserta', scheduled: 'Terjadwal', live: 'Berlangsung', paused: 'Jeda', review: 'Konfirmasi hasil', finished: 'Selesai' }
export function uid() {
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (Number(c) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(c) / 4).toString(16))
}
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const token = localStorage.getItem('tempo-token')
  const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/v1${path}`, {
    method, headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10000),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event('tempo-expired'))
    throw new Error(result.errors ? (Object.values(result.errors).flat() as string[]).join(' ') : result.message || 'Permintaan gagal. Coba lagi.')
  }
  return result
}
export function useLive<T>(path: string, interval = 2000) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [updated, setUpdated] = useState(0)
  const refresh = useCallback(async () => {
    try { const next = await api<T>(path); setData(next); setError(''); setUpdated(Date.now()) }
    catch (e) { setError(e instanceof Error ? e.message : 'Koneksi terputus') }
  }, [path])
  useEffect(() => {
    let alive = true
    let timer: ReturnType<typeof setTimeout>
    async function poll() { await refresh(); if (alive) timer = setTimeout(poll, interval) }
    void poll()
    return () => { alive = false; clearTimeout(timer) }
  }, [refresh, interval])
  return { data, setData, error, updated, refresh }
}
export function pointLabel(match: Match, team: number) {
  const p = match.state.points
  if (match.state.mode !== 'regular') return String(p[team])
  if (p[team] >= 3 && p[1 - team] >= 3) return p[team] > p[1 - team] ? 'AD' : '40'
  return ['0', '15', '30', '40'][Math.min(p[team], 3)]
}
export function deuceRule(rules: Rules) { return rules.deuce_rule ?? (rules.golden_point ? 'golden' : 'advantage') }
export function deuceLabel(rules: Rules) {
  const rule = deuceRule(rules)
  return rule === 'one_advantage' ? '1 advantage → golden point' : rule === 'golden' ? 'Golden point' : 'Advantage'
}
export function isGoldenPoint(match: Match) {
  const rule = deuceRule(match.rules)
  const threshold = rule === 'golden' ? 3 : rule === 'one_advantage' ? 4 : Infinity
  return match.state.mode === 'regular' && match.state.winner === null && match.state.points[0] === match.state.points[1] && match.state.points[0] >= threshold
}
export function rulesLabel(rules: Rules) { return `${rules.regular_sets === 1 ? '1 set' : `2 set + STB ${rules.super_points}${rules.super_win_by_two === false ? ' tanpa selisih 2' : ' selisih 2'}`} · ${rules.games_to_win} game · ${deuceLabel(rules)} · TB ${rules.tiebreak_at ?? rules.games_to_win}–${rules.tiebreak_at ?? rules.games_to_win}, ${rules.tiebreak_points} poin${rules.tiebreak_win_by_two === false ? ' tanpa selisih 2' : ' selisih 2'}` }

export type Submit = (path: string, body: unknown, method?: string) => Promise<boolean>

export const formValue = (form: FormData, key: string) => String(form.get(key) || '').trim()

export function courtSchedule(matches: Match[], courtId: number | null | undefined) {
  const list = courtId ? matches.filter(match => match.court_id === courtId) : []
  const pending = list.filter(match => ['scheduled', 'waiting'].includes(match.status)).sort((a, b) => (a.queue_position ?? a.id) - (b.queue_position ?? b.id) || a.id - b.id)
  const active = list.find(match => ['live', 'paused', 'review'].includes(match.status))
  const current = active || pending[0] || list.filter(match => match.status === 'finished').sort((a, b) => (Date.parse(b.finished_at || '') || 0) - (Date.parse(a.finished_at || '') || 0) || b.id - a.id)[0]
  const upcoming = pending.filter(match => match.id !== current?.id)
  return { current, next: upcoming[0], pending, queueCount: upcoming.length }
}

export function queueMatches(data: Data): Match[] {
  return [...data.matches, ...(data.knockout_schedule ?? []).filter(fixture => fixture.reservation_id && fixture.court_id && !fixture.bye).map(fixture => ({
    id: -fixture.reservation_id!, reservation_id: fixture.reservation_id!, tier_id: fixture.tier_id, court_id: fixture.court_id, queue_position: fixture.queue_position,
    stage: 'knockout' as const, group_name: `${fixture.round_name} · ${fixture.number}`, team_a: fixture.team_a ?? fixture.label_a, team_b: fixture.team_b ?? fixture.label_b,
    status: 'waiting', version: fixture.version, rules: data.tiers.find(tier => tier.id === fixture.tier_id)?.rules ?? defaults,
    state: { points: [0, 0], games: [0, 0], sets: [], mode: 'regular', server: 0, winner: null },
  }))]
}
