import { formValue as field } from '@/lib/padel'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { Activity, ArrowRight, Check, ChevronRight, CircleDot, ClipboardList, Clock3, Eye, EyeOff, LayoutDashboard, Monitor, Plus, Radio, ShieldCheck, Trophy, Undo2, X } from 'lucide-react'
import { api, courtSchedule, defaults, pointLabel, rulesLabel, statuses, uid, useLive } from '@/lib/padel'
import type { Data, Match, User } from '@/lib/padel'
import { TempoLogo } from '@/components/shared/tempo-logo'
import { AdminLayout } from '@/layouts/admin-layout'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AppSelect } from '@/components/shared/app-select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import type { Submit } from '@/lib/padel'
import { Field } from '@/pages/padel/form-fields'
import { toast } from 'sonner'
import { Connection } from '@/components/shared/padel-connection'
import { RouteLoading } from '@/components/shared/route-loading'

const TournamentsPage = lazy(() => import('@/pages/padel/tournaments-page').then(module => ({ default: module.TournamentsPage })))
const TiersPage = lazy(() => import('@/pages/padel/tiers-page').then(module => ({ default: module.TiersPage })))
const RefereesPage = lazy(() => import('@/pages/padel/referees-page').then(module => ({ default: module.RefereesPage })))
const PresetsPage = lazy(() => import('@/pages/padel/presets-page').then(module => ({ default: module.PresetsPage })))
const AssignmentsPage = lazy(() => import('@/pages/padel/assignments-page').then(module => ({ default: module.AssignmentsPage })))
const CourtsPage = lazy(() => import('@/pages/padel/master-data-page').then(module => ({ default: module.CourtsPage })))
const MasterDataPage = lazy(() => import('@/pages/padel/master-data-page').then(module => ({ default: module.MasterDataPage })))
const ProgressionPage = lazy(() => import('@/pages/padel/progression-page').then(module => ({ default: module.ProgressionPage })))
const MatchesPage = lazy(() => import('@/pages/padel/matches-page').then(module => ({ default: module.MatchesPage })))

function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="flex min-h-60 flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground"><CircleDot className="size-8" /><h3 className="text-base font-semibold text-foreground">{title}</h3><p className="max-w-sm text-sm leading-relaxed">{children}</p></div>
}


function Login({ onLogin }: { onLogin: () => void }) {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = new FormData(e.currentTarget); setBusy(true); setError('')
    try { const result = await api<{ token: string; user: User }>('/login', 'POST', { email: field(form, 'email'), password: String(form.get('password')) }); localStorage.setItem('tempo-token', result.token); onLogin() }
    catch (e) { setError(e instanceof Error ? e.message : 'Login gagal') } finally { setBusy(false) }
  }
  return <main className="flex min-h-svh items-center justify-center bg-background p-4"><Card className="w-full max-w-sm"><CardHeader><TempoLogo className="mb-4 w-32" /><CardTitle>Masuk ke akun</CardTitle><CardDescription>Gunakan akun panitia atau wasit turnamen.</CardDescription></CardHeader><CardContent><form onSubmit={login} className="space-y-4"><Field label="Email"><Input name="email" type="email" autoComplete="username" required placeholder="Masukkan email kamu" /></Field><div className="space-y-2">
      <Label htmlFor="login-password">Password</Label>
      <div className="relative">
        <Input id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required placeholder="Masukkan password kamu" className="h-9 pr-11" />
        <Button type="button" variant="ghost" size="icon" className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} aria-controls="login-password" aria-pressed={showPassword} onClick={() => setShowPassword(visible => !visible)}>
          {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </Button>
      </div>
    </div>{error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}<Button type="submit" className="w-full" disabled={busy}>{busy ? 'Memeriksa…' : 'Masuk'}<ArrowRight /></Button><Button variant="outline" className="w-full" render={<a href="/" />}><Monitor />Buka layar TV</Button></form></CardContent></Card></main>
}

function Scorer({ match, court, online, admin, onClose, refresh, canStart = true, preview = false, resultsLocked = false }: { match: Match; court: string; online: boolean; admin: boolean; onClose?: () => void; refresh: () => Promise<void>; canStart?: boolean; preview?: boolean; resultsLocked?: boolean }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [server, setServer] = useState(0); const [history, setHistory] = useState<{ id: number; action: string; team: number | null; undone: boolean; created_at: string }[]>([])
  const lock = useRef(false)
  async function act(action: string, team?: number) {
    if (preview || lock.current || !online) return
    if (['confirm', 'reopen'].includes(action) && !window.confirm(action === 'confirm' ? 'Konfirmasi hasil akhir? Setelah disimpan, koreksi membutuhkan panitia.' : 'Buka kembali hasil untuk koreksi?')) return
    lock.current = true; setBusy(true); setError('')
    try { await api(`/matches/${match.id}/score`, 'POST', { action, ...(team !== undefined ? { team } : {}), server, version: match.version, command_id: uid() }); await refresh() }
    catch (e) { setError((e instanceof Error ? e.message : 'Gagal menyimpan') + ' Periksa skor terbaru sebelum input berikutnya.'); await refresh() }
    finally { lock.current = false; setBusy(false) }
  }
  useEffect(() => { if (preview) return; void api<typeof history>(`/matches/${match.id}/history`).then(setHistory).catch(() => {}) }, [match.id, match.version, preview])
  const disabled = busy || !online || preview
  return <section className={`mx-auto w-full max-w-2xl space-y-4 ${preview ? '[&_button:disabled]:opacity-100' : ''}`}>
    <div className="flex items-center justify-between gap-4"><div><p className="text-sm text-muted-foreground">Panel wasit / {court}</p><h2 className="text-lg font-semibold">{match.group_name}</h2></div>{onClose && <Button variant="ghost" size="icon" aria-label="Tutup" onClick={onClose}><X /></Button>}</div>
    <AdminCourtCard court={court} match={match} />
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    {!online && <Alert variant="destructive"><AlertDescription>Input dikunci sampai koneksi kembali. Poin yang belum dikirim tidak disimpan otomatis.</AlertDescription></Alert>}
    {match.status === 'scheduled' && <Card><CardContent className="space-y-4"><Field label="Urutan servis pertama"><AppSelect className="w-full" value={server} onValueChange={value => setServer(Number(value))} options={[`${match.team_a} · pemain 1`, `${match.team_b} · pemain 1`, `${match.team_a} · pemain 2`, `${match.team_b} · pemain 2`].map((label, value) => ({ value, label }))} /></Field><p className="text-xs leading-relaxed text-muted-foreground">Rotasi berikutnya: A1 → B1 → A2 → B2. Pastikan urutan pemain sebelum mulai.</p>{!canStart && <p className="text-sm text-muted-foreground">Pertandingan ini masih menunggu giliran. Selesaikan pertandingan sebelumnya terlebih dahulu.</p>}<Button className="w-full" disabled={disabled || !canStart} onClick={() => void act('start')}><Activity />Mulai pertandingan</Button></CardContent></Card>}
    {match.status === 'live' && <><p className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><CircleDot className="size-3" />Servis: {match.state.server % 2 === 0 ? match.team_a : match.team_b} · pemain {match.state.server < 2 ? '1' : '2'}</p><div className="grid grid-cols-2 gap-3">{[0, 1].map(team => <Button variant={team === 0 ? 'default' : 'outline'} className="h-auto min-h-44 flex-col gap-4 whitespace-normal px-4 py-6 text-center" disabled={disabled} key={team} onClick={() => void act('point', team)}><span className="text-xs">POIN PASANGAN {team === 0 ? 'A' : 'B'}</span><Plus className="size-10" /><strong className="text-sm">{team === 0 ? match.team_a : match.team_b}</strong></Button>)}</div></>}
    {match.status === 'review' && <Card><CardContent className="flex flex-col items-center gap-4 text-center"><Trophy className="size-7" /><h3 className="text-xl font-semibold">{match.state.winner === 0 ? match.team_a : match.team_b} menang</h3><p className="text-sm text-muted-foreground">Periksa hasil sebelum konfirmasi. Gunakan undo jika poin terakhir salah.</p><Button disabled={disabled} onClick={() => void act('confirm')}><Check />Konfirmasi hasil akhir</Button></CardContent></Card>}
    <div className="flex flex-wrap justify-center gap-2">{['live', 'paused', 'review'].includes(match.status) && <Button variant="outline" disabled={disabled || !history.some(e => e.action === 'point' && !e.undone)} onClick={() => void act('undo')}><Undo2 />Undo poin terakhir</Button>}{['live', 'paused'].includes(match.status) && <Button variant="outline" disabled={disabled} onClick={() => void act(match.status === 'live' ? 'pause' : 'resume')}>{match.status === 'live' ? 'Jeda pertandingan' : 'Lanjutkan pertandingan'}</Button>}{match.status === 'finished' && admin && !resultsLocked && <Button variant="outline" disabled={disabled} onClick={() => void act('reopen')}>Buka kembali untuk koreksi</Button>}</div>
    {match.status === 'finished' && resultsLocked && <p className="text-center text-xs text-muted-foreground">Hasil terkunci karena bagan knockout sudah dikonfirmasi.</p>}
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Clock3 className="size-4" />Riwayat pencatatan</CardTitle><CardDescription>40 aktivitas terakhir</CardDescription></CardHeader><CardContent>{history.length ? <Table><TableBody>{history.map(event => <TableRow key={event.id} className={event.undone ? 'text-muted-foreground line-through' : ''}><TableCell>{event.action === 'point' ? `Poin ${event.team === 0 ? 'A' : 'B'}${event.undone ? ' · dibatalkan' : ''}` : ({ start: 'Pertandingan dimulai', undo: 'Koreksi poin', pause: 'Jeda', resume: 'Dilanjutkan', confirm: 'Hasil dikonfirmasi', reopen: 'Hasil dibuka kembali' } as Record<string, string>)[event.action]}</TableCell><TableCell className="text-right text-xs text-muted-foreground">{event.created_at}</TableCell></TableRow>)}</TableBody></Table> : <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>}</CardContent></Card>
    <p className="text-center text-xs text-muted-foreground">{preview ? 'Pratinjau statis · tombol pencatatan dinonaktifkan' : busy ? 'Menyimpan perubahan…' : `Skor tersimpan · versi ${match.version}`}</p>
  </section>
}
export function RefereePreview() {
  const [phase, setPhase] = useState('live')
  const match: Match = {
    id: 0, tier_id: 0, court_id: 0, queue_position: 1,
    group_name: 'Grup A · Contoh', team_a: 'Andi / Budi', team_b: 'Candra / Dedi',
    status: phase, version: 0, rules: defaults,
    state: {
      points: phase === 'live' ? [2, 1] : [0, 0],
      games: phase === 'live' ? [3, 2] : [0, 0],
      sets: phase === 'review' ? [{ games: [6, 3], kind: 'regular', winner: 0 }, { games: [6, 4], kind: 'regular', winner: 0 }] : [],
      mode: 'regular', server: 0, winner: phase === 'review' ? 0 : null,
    },
  }
  return <div className="space-y-6"><PageHeader title="Pratinjau tampilan wasit" description="Contoh panel wasit dalam lebar layar HP. Data contoh ini terpisah dari pertandingan asli." />
    <div className="mx-auto max-w-md space-y-4"><Field label="Lihat tahap pertandingan"><AppSelect value={phase} onValueChange={setPhase} options={[{ value: 'scheduled', label: 'Sebelum pertandingan dimulai' }, { value: 'live', label: 'Saat pertandingan berlangsung' }, { value: 'review', label: 'Konfirmasi hasil akhir' }]} /></Field>
      <div className="space-y-5 rounded-2xl border bg-muted/20 p-4"><div className="flex items-center justify-between border-b pb-4"><TempoLogo className="w-24" /><Badge variant="outline">Pratinjau HP</Badge></div><Scorer match={match} court="Court 1" online admin={false} preview refresh={async () => {}} /></div>
    </div>
  </div>
}

function AdminCourtCard({ court, match, tier, open, nextMatch }: { court: string; match?: Match; tier?: string; open?: (id: number) => void; nextMatch?: Match }) {
  return <Card>
    <CardHeader><div className="flex items-center justify-between gap-2"><CardTitle className="text-base">{court}</CardTitle><Badge variant={match?.status === 'live' ? 'default' : 'secondary'}>{match ? statuses[match.status] : 'Standby'}</Badge></div><CardDescription>{match ? `${tier ? tier + ' · ' : ''}${match.group_name}` : 'Menunggu pertandingan'}</CardDescription></CardHeader>
    <CardContent className="space-y-4">{match ? <><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Pasangan</TableHead><TableHead className="text-center">Set</TableHead><TableHead className="text-center">Game</TableHead><TableHead className="text-right">Poin</TableHead></TableRow></TableHeader><TableBody>{[0, 1].map(team => <TableRow key={team}><TableCell className="max-w-44 whitespace-normal font-medium"><span className="inline-flex items-center gap-2">{match.state.server % 2 === team && match.status !== 'finished' && <CircleDot className="size-3 shrink-0 text-muted-foreground" />}{team === 0 ? match.team_a : match.team_b}{match.state.winner === team && <Check className="size-3 shrink-0" />}</span></TableCell><TableCell className="text-center text-muted-foreground">{match.state.sets.map(set => set.games[team]).join(' / ') || '–'}</TableCell><TableCell className="text-center tabular-nums">{match.state.mode === 'super' || match.state.winner !== null ? '–' : match.state.games[team]}</TableCell><TableCell className="text-right text-2xl font-semibold tabular-nums">{match.state.winner !== null ? (match.state.winner === team ? 'W' : '–') : pointLabel(match, team)}</TableCell></TableRow>)}</TableBody></Table></div><div className="flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{match.state.mode === 'super' ? 'Super tie-break' : match.state.mode === 'tiebreak' ? 'Tie-break' : rulesLabel(match.rules)}</span>{open && <Button variant="outline" size="sm" onClick={() => open(match.id)}>Buka<ChevronRight /></Button>}</div></> : <div className="flex min-h-36 flex-col items-center justify-center gap-3 text-muted-foreground"><CircleDot className="size-7" /><p className="text-sm">Jadwalkan dari menu Jadwal & hasil.</p></div>}{nextMatch && <div className="border-t pt-3"><p className="mb-1 text-xs font-medium text-muted-foreground">Next match</p><p className="text-sm font-medium">{nextMatch.team_a} <span className="text-muted-foreground">vs</span> {nextMatch.team_b}</p></div>}</CardContent>
  </Card>
}
function Overview({ data, open }: { data: Data; open: (id: number) => void }) {
  const active = data.matches.filter(m => ['live', 'paused'].includes(m.status))
  return <div className="space-y-6"><PageHeader title="Dashboard" description="Pantau pertandingan, penugasan, dan skor setiap court." action={<Button className="h-9" render={<a href="/" target="_blank" rel="noreferrer" />}><Monitor />Buka layar TV</Button>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard title="Total court" value={String(data.courts.length)} icon={LayoutDashboard} /><StatCard title="Sedang bertanding" value={String(active.length)} icon={Activity} /><StatCard title="Pertandingan selesai" value={String(data.matches.filter(m => m.status === 'finished').length)} icon={ShieldCheck} /><StatCard title="Total pertandingan" value={String(data.matches.length)} icon={ClipboardList} /></div>
    {!data.tournaments.length && <Card><CardContent className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-sm font-semibold">Siapkan turnamen pertama</h2><p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">Mulai dari turnamen, tambahkan tier dan peserta, lalu tempatkan pertandingan serta wasit ke court.</p></div><Button variant="outline" className="h-9 shrink-0" render={<Link to="/admintempo/tournaments" />}>Buat turnamen<ArrowRight /></Button></CardContent></Card>}
    <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-semibold tracking-tight">Live courts</h2><p className="mt-1 text-sm text-muted-foreground">Pantau skor dan kesiapan setiap lapangan.</p></div><Badge variant="outline"><Radio className="size-3" />{data.courts.length} court</Badge></div>
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{data.courts.map(court => { const { current: match, next } = courtSchedule(data.matches, court.id); return <AdminCourtCard key={court.id} court={court.name} match={match} tier={data.tiers.find(t => t.id === match?.tier_id)?.name} nextMatch={next} open={open} /> })}</div>
  </div>
}

function Password({ submit, busy, user }: { submit: Submit; busy: boolean; user: User }) {
  return <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
    <Card><CardHeader><CardTitle>Profil akun</CardTitle><CardDescription>Identitas dan hak akses akun saat ini.</CardDescription></CardHeader><CardContent><div className="mb-6 flex items-center gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-muted text-sm font-semibold">{user.name.slice(0, 2).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{user.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{user.email}</p></div></div><dl className="divide-y text-sm"><div className="flex items-center justify-between py-3"><dt className="text-muted-foreground">Peran</dt><dd><Badge variant="secondary">{user.role === 'admin' ? 'Panitia' : 'Wasit'}</Badge></dd></div><div className="py-3"><dt className="mb-2 text-muted-foreground">Email login</dt><dd className="break-all">{user.email}</dd></div></dl></CardContent></Card>
    <Card><CardHeader><CardTitle>Ganti password</CardTitle><CardDescription>Gunakan minimal 10 karakter untuk password baru.</CardDescription></CardHeader><CardContent><form onSubmit={async event => { event.preventDefault(); const element = event.currentTarget; const form = new FormData(element); if (await submit('/password', { current_password: String(form.get('current_password')), password: String(form.get('password')), password_confirmation: String(form.get('confirmation')) })) element.reset() }}><fieldset disabled={busy} className="min-w-0"><Field label="Password saat ini"><Input name="current_password" type="password" autoComplete="current-password" required /></Field><div className="my-5 border-t" /><Field label="Password baru"><Input name="password" type="password" autoComplete="new-password" required minLength={10} placeholder="Minimal 10 karakter" /></Field><Field label="Ulangi password baru"><Input name="confirmation" type="password" autoComplete="new-password" required minLength={10} /></Field></fieldset><div className="mt-6 flex justify-end border-t pt-5"><Button className="h-9" type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan password'}</Button></div></form></CardContent></Card>
  </div>
}
function Workspace({ onLogout }: { onLogout: () => void }) {
  const { data, error, updated, refresh } = useLive<Data>('/data')
  const [busy, setBusy] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const mutation = useRef(false)
  const submit: Submit = async (path, body, method = 'POST') => {
    if (mutation.current) return false
    mutation.current = true
    setBusy(true)
    try {
      await api(path, method, body)
      await refresh()
      toast.success('Perubahan berhasil disimpan.')
      return true
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menyimpan')
      return false
    } finally {
      setBusy(false)
      mutation.current = false
    }
  }
  async function logout() {
    try { await api('/logout', 'POST') } catch { /* Clear the local session when offline too. */ }
    onLogout()
  }
  if (!data) return <div className="flex min-h-svh flex-col items-center justify-center gap-4"><p className="text-sm text-muted-foreground">{error || 'Menyiapkan pusat turnamen…'}</p><Button variant="outline" onClick={onLogout}>Kembali ke login</Button></div>
  const admin = data.user.role === 'admin'
  const chosen = data.matches.find(m => m.id === selected)
  const assigned = data.courts.find(c => c.referee_id === data.user.id)
  const refCurrent = courtSchedule(data.matches, assigned?.id).current
  const refMatch = refCurrent?.status === 'finished' ? undefined : refCurrent
  return <AdminLayout user={data.user} onLogout={() => void logout()} headerAction={<Connection error={error} updated={updated} />}>
    <div className="space-y-6">
      {error && <Alert variant="destructive"><AlertDescription>{error}. Tampilan menggunakan data terakhir; input skor dikunci sampai tersambung.</AlertDescription></Alert>}
      <Suspense fallback={<RouteLoading />}><Routes>
        {admin ? <>
          <Route index element={<Navigate to="/admintempo/dashboard" replace />} />
          <Route path="dashboard" element={<Overview data={data} open={setSelected} />} />
          <Route path="tournaments" element={<TournamentsPage data={data} submit={submit} busy={busy} />} />
          <Route path="tiers" element={<TiersPage data={data} submit={submit} busy={busy} />} />
          <Route path="wasit-preview" element={<RefereePreview />} />
          <Route path="assignments" element={<AssignmentsPage data={data} submit={submit} busy={busy} />} />
          <Route path="master-data" element={<MasterDataPage data={data} />} />
          <Route path="master-data/courts" element={<CourtsPage data={data} />} />
          <Route path="master-data/referees" element={<RefereesPage data={data} submit={submit} busy={busy} />} />
          <Route path="master-data/presets" element={<PresetsPage data={data} submit={submit} busy={busy} />} />
          <Route path="competitions" element={<Navigate to="/admintempo/tournaments" replace />} />
          <Route path="progression" element={<ProgressionPage data={data} submit={submit} busy={busy} open={setSelected} />} />
          <Route path="matches" element={<MatchesPage data={data} submit={submit} busy={busy} open={setSelected} />} />
          <Route path="referees" element={<Navigate to="/admintempo/master-data/referees" replace />} />
          <Route path="presets" element={<Navigate to="/admintempo/master-data/presets" replace />} />
        </> : <Route index element={<div className="space-y-6"><PageHeader title={assigned ? `${assigned.name} · Panel wasit` : 'Court saya'} description={`Halo, ${data.user.name}. Pertandingan diperbarui otomatis.`} />{refMatch ? <div><Scorer key={refMatch.id} match={refMatch} court={assigned?.name || ''} online={!error} admin={false} refresh={refresh} /></div> : <Empty title={assigned ? `${assigned.name} siap bertugas` : 'Menunggu penugasan court'}>{assigned ? 'Pertandingan berikutnya akan muncul setelah dijadwalkan panitia.' : 'Hubungi panitia untuk penugasan court.'}</Empty>}</div>} />}
        <Route path="account" element={<div className="space-y-6"><PageHeader title="Pengaturan akun" description="Kelola password akun Anda." /><Password submit={submit} busy={busy} user={data.user} /></div>} />
        <Route path="*" element={<Navigate to={admin ? '/admintempo/dashboard' : '/admintempo'} replace />} />
      </Routes></Suspense>
    </div>
    <Dialog open={Boolean(chosen)} onOpenChange={open => { if (!open) setSelected(null) }}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Kontrol pertandingan</DialogTitle></DialogHeader>
        {chosen && <div><Scorer key={chosen.id} match={chosen} court={data.courts.find(c => c.id === chosen.court_id)?.name || ''} online={!error} admin={admin} refresh={refresh} resultsLocked={Boolean(data.tiers.find(tier => tier.id === chosen.tier_id)?.knockout?.confirmed_at)} canStart={courtSchedule(data.matches, chosen.court_id).current?.id === chosen.id} /></div>}
      </DialogContent>
    </Dialog>
  </AdminLayout>
}
export default function PrivateApp() {
  const [loggedIn, setLoggedIn] = useState(Boolean(localStorage.getItem('tempo-token')))
  useEffect(() => { const expired = () => { localStorage.removeItem('tempo-token'); setLoggedIn(false) }; window.addEventListener('tempo-expired', expired); return () => window.removeEventListener('tempo-expired', expired) }, [])
  return loggedIn ? <Workspace onLogout={() => { localStorage.removeItem('tempo-token'); setLoggedIn(false) }} /> : <Login onLogin={() => setLoggedIn(true)} />
}
