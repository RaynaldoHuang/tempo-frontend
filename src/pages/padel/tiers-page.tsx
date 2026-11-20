import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowUpRight, Plus } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { defaults, formValue as field, rulesLabel } from '@/lib/padel'
import type { Data, Submit, Rules } from '@/lib/padel'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AppSelect } from '@/components/shared/app-select'
import { toast } from 'sonner'
import { ParticipantsFields } from './participants-fields'
import { newPair, newGroup, groupLabel, participantErrors } from '@/lib/participants'
import type { ParticipantGroup } from '@/lib/participants'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Field, RulesFields } from './form-fields'
import { FormDialog, FormSection, ListEmpty, SearchField } from './page-parts'

export function TiersPage({ data, submit, busy }: { data: Data; submit: Submit; busy: boolean }) {
  const [params, setParams] = useSearchParams()
  const tournamentFilter = params.get('tournament') || ''
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [rules, setRules] = useState<Rules>(defaults)
  const [preset, setPreset] = useState('')
  const [format, setFormat] = useState('group')
  const [knockoutCount, setKnockoutCount] = useState(8)
  const [drawMode, setDrawMode] = useState('ordered')
  const [participants, setParticipants] = useState<ParticipantGroup[]>(() => [newGroup()])
  const filtered = data.tiers.filter(t => (!tournamentFilter || t.tournament_id === Number(tournamentFilter)) && t.name.toLowerCase().includes(search.toLowerCase()))
  function resizeKnockout(size: number) {
    const pairs = participants.flatMap(group => group.pairs)
    if (pairs.slice(size).some(pair => pair.players.some(name => name.trim())) && !window.confirm('Mengurangi ukuran bagan akan menghapus slot pemain di bagian akhir. Lanjutkan?')) return
    setParticipants([{ id: participants[0].id, pairs: Array.from({ length: size }, (_, index) => pairs[index] ?? newPair()) }])
    setKnockoutCount(size)
  }
  function changeFormat(value: string) {
    if (value === 'direct' && participants.some(group => group.pairs.length > 2)) { toast.error('Kurangi menjadi 2 pasangan per grup sebelum memilih pertandingan lepas.'); return }
    if (value === 'knockout') {
      const pairs = participants.flatMap(group => group.pairs)
      if (pairs.length > 16) { toast.error('Knockout langsung mendukung maksimal 16 pasangan. Kurangi jumlah pasangan terlebih dahulu.'); return }
      const size = Math.max(knockoutCount, pairs.length)
      setParticipants([{ id: participants[0].id, pairs: Array.from({ length: size }, (_, index) => pairs[index] ?? newPair()) }])
      setKnockoutCount(size)
    }
    setFormat(value)
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (Object.keys(participantErrors(participants)).length) { toast.error('Periksa nama pemain yang ditandai sebelum menyimpan.'); return }
    const groups = participants.map((group, index) => ({ name: groupLabel(index, format), teams: group.pairs.map(pair => pair.players.map(name => name.trim().replace(/\s+/g, ' ')).join(' / ')) }))
    if (await submit('/tiers', { tournament_id: Number(form.get('tournament_id')), name: field(form, 'name'), format, rules, groups, ...(format === 'knockout' ? { draw_mode: drawMode } : {}) })) { setOpen(false); setParticipants([newGroup()]); setFormat('group') }
  }
  return <div className="space-y-6"><PageHeader title="Tier & grup" description="Atur kategori, peserta, dan format skor untuk setiap turnamen." action={<Button className="h-9" disabled={!data.tournaments.length} onClick={() => setOpen(true)}><Plus />Tambah tier</Button>} />
    <Card className="gap-0 overflow-hidden"><CardHeader className="gap-4 pb-5"><div><CardTitle>Daftar tier</CardTitle><CardDescription className="mt-1">{data.tiers.length} tier dalam {data.tournaments.length} turnamen</CardDescription></div><div className="flex flex-col gap-3 sm:flex-row"><SearchField value={search} onChange={setSearch} placeholder="Cari nama tier…" /><AppSelect className="w-full sm:w-56" aria-label="Filter turnamen" value={tournamentFilter} onValueChange={value => setParams(value ? { tournament: value } : {})} options={[{ value: '', label: 'Semua turnamen' }, ...data.tournaments.map(t => ({ value: t.id, label: t.name }))]} /></div></CardHeader>
      <CardContent className="px-0">{filtered.length ? <Table><TableHeader><TableRow><TableHead className="pl-6">Tier</TableHead><TableHead>Sistem</TableHead><TableHead>Peserta</TableHead><TableHead>Format skor</TableHead><TableHead className="pr-6 text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{filtered.map(t => <TableRow key={t.id}><TableCell className="pl-6"><p className="font-medium">{t.name}</p><p className="mt-1 text-xs text-muted-foreground">{data.tournaments.find(x => x.id === t.tournament_id)?.name}</p></TableCell><TableCell><Badge variant="secondary">{t.format === 'group' ? `${t.groups.length} grup` : t.format === 'knockout' ? 'Knockout langsung' : 'Pertandingan lepas'}</Badge></TableCell><TableCell>{t.groups.reduce((sum, group) => sum + group.teams.length, 0)} pasangan</TableCell><TableCell className="max-w-64 whitespace-normal text-xs leading-relaxed text-muted-foreground">{rulesLabel(t.rules)}</TableCell><TableCell className="pr-6 text-right"><div className="flex justify-end gap-1">{['group', 'knockout'].includes(t.format) && <Button variant="outline" size="sm" nativeButton={false} render={<Link to={`/admintempo/progression?tier=${t.id}`} />}>{t.format === 'knockout' ? 'Bagan' : 'Klasemen'}<ArrowUpRight /></Button>}<Button variant="ghost" size="sm" nativeButton={false} render={<Link to={`/admintempo/matches?tier=${t.id}`} />}>Pertandingan<ArrowUpRight /></Button></div></TableCell></TableRow>)}</TableBody></Table> : <ListEmpty title={!data.tournaments.length ? 'Buat turnamen terlebih dahulu' : search || tournamentFilter ? 'Tier tidak ditemukan' : 'Belum ada tier'} description={!data.tournaments.length ? 'Tier dan grup akan mengikuti turnamen yang kamu pilih.' : 'Tambahkan tier atau sesuaikan filter untuk melihat data.'} action={!data.tournaments.length ? <Button variant="outline" render={<Link to="/admintempo/tournaments" />}>Buka turnamen<ArrowUpRight /></Button> : undefined} />}</CardContent>
    </Card>
    <FormDialog open={open} onOpenChange={setOpen} title="Tambah tier & grup" description={format === 'knockout' ? 'Atur peserta dan aturan skor, lalu periksa preview sebelum mengonfirmasi bagan.' : 'Atur kategori dan aturan skor. Pertandingan akan dibuat otomatis setelah disimpan.'} busy={busy} onSubmit={save} submitLabel={format === 'knockout' ? 'Simpan & preview bagan' : 'Simpan & buat pertandingan'} wide>
      <FormSection title="1. Identitas kategori"><div className="grid gap-x-4 sm:grid-cols-2"><Field label="Turnamen"><AppSelect className="w-full" name="tournament_id" required defaultValue={tournamentFilter} options={[{ value: '', label: 'Pilih turnamen', disabled: true }, ...data.tournaments.map(t => ({ value: t.id, label: t.name }))]} /></Field><Field label="Nama tier"><Input name="name" required maxLength={100} placeholder="Bronze / Silver / Gold" /></Field></div><Field label="Sistem kompetisi"><AppSelect className="w-full" value={format} onValueChange={changeFormat} options={[{ value: 'group', label: 'Grup → knockout' }, { value: 'knockout', label: 'Knockout langsung · tanpa fase grup' }, { value: 'direct', label: 'Pertandingan lepas' }]} /></Field></FormSection>
      <FormSection title="2. Format pertandingan" description="Pilih preset tersimpan atau sesuaikan aturan untuk tier ini."><Field label="Preset skor"><AppSelect className="w-full" value={preset} onValueChange={value => { setPreset(value); const selected = data.presets.find(p => p.id === Number(value)); if (selected) setRules({ ...selected.rules }) }} options={[{ value: '', label: 'Pengaturan kustom' }, ...data.presets.map(p => ({ value: p.id, label: p.name }))]} /></Field><RulesFields rules={rules} onChange={next => { setRules(next); setPreset('') }} /></FormSection>
      <FormSection title={format === 'knockout' ? '3. Peserta & pertemuan awal' : '3. Pasangan & pembagian grup'} description={format === 'knockout' ? 'Isi peserta pada slot bagan. Jika ada BYE, peserta pada urutan awal mendapatkannya. Peserta lainnya dipasangkan berurutan. Dalam mode undian, susunan dan penerima BYE diacak saat disimpan. Preview dapat diperiksa sebelum bagan dikonfirmasi.' : 'Isi satu nama di setiap kolom pemain. Pasangan dan grup ditampilkan terpisah agar mudah diperiksa.'}>{format === 'knockout' && <div className="grid gap-4 sm:grid-cols-2"><Field label="Jumlah pasangan"><AppSelect value={knockoutCount} onValueChange={value => resizeKnockout(Number(value))} options={Array.from({ length: 15 }, (_, index) => ({ value: index + 2, label: `${index + 2} pasangan` }))} /></Field><Field label="Susunan pertemuan"><AppSelect value={drawMode} onValueChange={setDrawMode} options={[{ value: 'ordered', label: 'Manual · mengikuti urutan slot' }, { value: 'random', label: 'Undi otomatis saat disimpan' }]} /></Field></div>}{format === 'knockout' && <div className="rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed"><p className="font-semibold">{knockoutCount} pasangan · bagan {2 ** Math.ceil(Math.log2(knockoutCount))} slot · {2 ** Math.ceil(Math.log2(knockoutCount)) - knockoutCount} BYE</p><p className="mt-1 text-muted-foreground">BYE tersebar di bagan dan otomatis maju satu babak tanpa membuat pertandingan kosong. Periksa penerimanya pada preview sebelum konfirmasi.</p></div>}<ParticipantsFields drawMode={drawMode} groups={participants} onChange={setParticipants} format={format} /><div className="rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">Ringkasan: {rulesLabel(rules)}</div></FormSection>
    </FormDialog>
  </div>
}
