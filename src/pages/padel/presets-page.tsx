import { useState } from 'react'
import type { FormEvent } from 'react'
import { Copy, Plus, Settings2, Trash2 } from 'lucide-react'
import { defaults, deuceLabel, formValue as field } from '@/lib/padel'
import type { Data, Preset, Submit } from '@/lib/padel'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Field, RulesFields } from './form-fields'
import { FormDialog, FormSection, ListEmpty, SearchField } from './page-parts'

export function PresetsPage({ data, submit, busy }: { data: Data; submit: Submit; busy: boolean }) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState<Preset | null>(null)
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const [rules, setRules] = useState(defaults)
  const filtered = data.presets.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (await submit('/presets', { name: field(form, 'name'), rules })) setOpen(false)
  }
  return <div className="space-y-6"><PageHeader title="Preset skor" description="Simpan format skor yang dapat dipakai kembali saat membuat tier." action={<Button className="h-9" onClick={() => { setName(''); setRules({ ...defaults }); setOpen(true) }}><Plus />Tambah preset</Button>} />
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><SearchField value={search} onChange={setSearch} placeholder="Cari preset skor…" /><p className="text-xs text-muted-foreground">{data.presets.length} format tersimpan</p></div>
    {filtered.length ? <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(p => <Card key={p.id} className="h-full"><CardHeader><div className="mb-2 flex items-center justify-between"><span className="flex size-9 items-center justify-center rounded-lg border bg-muted/30"><Settings2 className="size-4 text-muted-foreground" /></span><Badge variant="secondary">{p.rules.regular_sets === 2 ? '2 set + STB' : '1 set'}</Badge></div><CardTitle className="leading-relaxed">{p.name}</CardTitle><CardDescription>{deuceLabel(p.rules)} · {p.rules.tiebreak_win_by_two === false ? 'Tie-break tanpa selisih 2' : 'Tie-break selisih 2'}</CardDescription></CardHeader><CardContent className="flex-1"><dl className="space-y-3 text-sm">{[['Target game / set', p.rules.games_to_win], ['Tie-break', `${p.rules.tiebreak_at ?? p.rules.games_to_win}–${p.rules.tiebreak_at ?? p.rules.games_to_win} · ${p.rules.tiebreak_points} poin`], ...(p.rules.regular_sets === 2 ? [['Super tie-break', `${p.rules.super_points} poin · ${p.rules.super_win_by_two === false ? 'tanpa selisih 2' : 'selisih 2'}`]] : [])].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd className="font-medium tabular-nums">{value}</dd></div>)}</dl></CardContent><CardFooter className="flex-wrap justify-end gap-2"><Button variant="destructive" size="sm" disabled={busy} onClick={() => setDeleting(p)}><Trash2 />Hapus</Button><Button variant="outline" size="sm" onClick={() => { setRules({ ...p.rules }); setName(`${p.name.slice(0, 90)} (salinan)`); setOpen(true) }}><Copy />Salin preset</Button></CardFooter></Card>)}</div> : <Card><ListEmpty title={search ? 'Preset tidak ditemukan' : 'Belum ada preset'} description={search ? 'Coba kata pencarian lain.' : 'Tambahkan format skor pertama untuk mempermudah pengaturan tier.'} /></Card>}
    <AlertDialog open={deleting !== null} onOpenChange={value => { if (!value && !busy) setDeleting(null) }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus preset?</AlertDialogTitle><AlertDialogDescription>Preset “{deleting?.name}” akan dihapus dari daftar. Aturan pada tier dan pertandingan yang sudah dibuat tetap tersimpan.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={busy} onClick={async () => { if (deleting && await submit(`/presets/${deleting.id}`, undefined, 'DELETE')) setDeleting(null) }}><Trash2 />{busy ? 'Menghapus…' : 'Hapus preset'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
    <FormDialog open={open} onOpenChange={setOpen} title="Tambah preset skor" description="Preset tersimpan dapat digunakan pada berbagai tier dan turnamen." busy={busy} onSubmit={save} submitLabel="Simpan preset" wide><FormSection title="Nama preset"><Field label="Nama format"><Input name="name" required maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Bronze · 2 set + STB" /></Field></FormSection><FormSection title="Aturan pertandingan"><RulesFields rules={rules} onChange={setRules} /></FormSection></FormDialog>
  </div>
}
