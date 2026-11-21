import { useState } from 'react'
import { FileDown } from 'lucide-react'
import { api } from '@/lib/padel'
import type { Data } from '@/lib/padel'
import { showReport } from '@/lib/tournament-report'
import type { TournamentReport } from '@/lib/tournament-report'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AppSelect } from '@/components/shared/app-select'
import { Field } from './form-fields'
import { FormDialog } from './page-parts'

export function ReportExport({ data }: { data: Data }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [tournament, setTournament] = useState('')
  const [tier, setTier] = useState('')
  const [period, setPeriod] = useState('all')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [sections, setSections] = useState({ results: true, standings: true, bracket: true })
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  return <>
    <Button variant="outline" className="h-9" onClick={() => { setError(''); setOpen(true) }}><FileDown />Ekspor Rekap PDF</Button>
    <FormDialog open={open} onOpenChange={setOpen} title="Ekspor Rekap PDF" description="Siapkan laporan, lalu pilih Simpan sebagai PDF pada menu cetak browser. Data diambil saat laporan dibuat." busy={busy} wide submitLabel="Buat laporan PDF" onSubmit={async event => {
      event.preventDefault()
      setError('')
      if (!Object.values(sections).some(Boolean)) { setError('Pilih minimal satu isi laporan.'); return }
      const target = window.open('', '_blank')
      if (!target) { setError('Izinkan pop-up untuk membuka laporan, lalu coba lagi.'); return }
      target.opener = null
      target.document.title = 'Menyiapkan rekap turnamen'
      target.document.body.textContent = 'Mengambil data terbaru untuk laporan. Tunggu sebentar…'
      setBusy(true)
      try {
        const query = new URLSearchParams({ period, ...Object.fromEntries(Object.entries(sections).map(([key, value]) => [key, value ? '1' : '0'])) })
        if (tournament) query.set('tournament_id', tournament)
        if (tier) query.set('tier_id', tier)
        if (period === 'range') { query.set('start_date', start); query.set('end_date', end) }
        const report = await api<TournamentReport>(`/reports/tournament?${query}`)
        if (target.closed) throw new Error('Jendela laporan sudah ditutup. Buka laporan sekali lagi.')
        showReport(target, report)
        setOpen(false)
      } catch (cause) {
        target.close()
        setError(cause instanceof Error ? cause.message : 'Laporan gagal dibuat. Coba lagi.')
      } finally { setBusy(false) }
    }}>
      <div className="grid gap-x-4 sm:grid-cols-2"><Field label="Turnamen"><AppSelect value={tournament} onValueChange={value => { setTournament(value); setTier('') }} options={[{ value: '', label: 'Seluruh turnamen' }, ...data.tournaments.map(item => ({ value: item.id, label: item.name }))]} /></Field><Field label="Kategori"><AppSelect value={tier} onValueChange={setTier} options={[{ value: '', label: 'Semua kategori' }, ...data.tiers.filter(item => !tournament || item.tournament_id === Number(tournament)).map(item => ({ value: item.id, label: `${item.name}${!tournament ? ` · ${data.tournaments.find(entry => entry.id === item.tournament_id)?.name ?? ''}` : ''}` }))]} /></Field></div>
      <Field label="Periode hasil pertandingan"><AppSelect value={period} onValueChange={setPeriod} options={[{ value: 'all', label: 'Seluruh turnamen sampai waktu ekspor' }, { value: 'today', label: 'Hari ini (WIB)' }, { value: 'range', label: 'Rentang tanggal (WIB)' }]} /></Field>
      {period === 'range' && <div className="grid gap-x-4 sm:grid-cols-2"><Field label="Tanggal mulai"><Input type="date" required max={end || today} value={start} onChange={event => setStart(event.target.value)} /></Field><Field label="Tanggal akhir"><Input type="date" required min={start} max={today} value={end} onChange={event => setEnd(event.target.value)} /></Field></div>}
      <fieldset className="space-y-3"><legend className="mb-3 text-sm font-medium">Isi laporan</legend>{([['results', 'Hasil pertandingan dan skor tiap set'], ['standings', 'Klasemen grup'], ['bracket', 'Jalur knockout dan pemenang setiap babak']] as const).map(([key, label]) => <label key={key} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={sections[key]} onChange={event => setSections(current => ({ ...current, [key]: event.target.checked }))} className="size-4 accent-primary" />{label}</label>)}</fieldset>
      <p className="rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">{period === 'all' ? 'Termasuk pertandingan terjadwal dan belum selesai. ' : 'Periode berdasarkan waktu selesai, atau waktu mulai untuk match yang belum selesai. Match yang belum mulai tidak masuk daftar periode. '}Klasemen, juara, dan jalur knockout menunjukkan keseluruhan data sampai waktu ekspor. Hasil belum dikonfirmasi ditandai sementara.</p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </FormDialog>
  </>
}
