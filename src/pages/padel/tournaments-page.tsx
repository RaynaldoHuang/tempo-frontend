import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowUpRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formValue as field } from '@/lib/padel'
import type { Data, Submit } from '@/lib/padel'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Field } from './form-fields'
import { FormDialog, FormSection, ListEmpty, SearchField } from './page-parts'

export function TournamentsPage({ data, submit, busy }: { data: Data; submit: Submit; busy: boolean }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const filtered = data.tournaments.filter(t => `${t.name} ${t.venue}`.toLowerCase().includes(search.toLowerCase()))
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (await submit('/tournaments', { name: field(form, 'name'), venue: field(form, 'venue'), date: field(form, 'date') || null })) setOpen(false)
  }
  return <div className="space-y-6">
    <PageHeader title="Turnamen" description="Kelola turnamen, lalu atur kategori dan pesertanya melalui Tier & grup." action={<Button className="h-9" onClick={() => setOpen(true)}><Plus />Tambah turnamen</Button>} />
    <Card className="gap-0 overflow-hidden"><CardHeader className="gap-4 pb-5"><div className="flex items-center justify-between"><div><CardTitle>Daftar turnamen</CardTitle><CardDescription className="mt-1">{data.tournaments.length} turnamen terdaftar</CardDescription></div><Badge variant="secondary">{filtered.length} ditampilkan</Badge></div><SearchField value={search} onChange={setSearch} placeholder="Cari nama turnamen atau venue…" /></CardHeader>
      <CardContent className="px-0">{filtered.length ? <Table><TableHeader><TableRow><TableHead className="pl-6">Turnamen</TableHead><TableHead>Venue</TableHead><TableHead>Tanggal</TableHead><TableHead>Tier</TableHead><TableHead className="pr-6 text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{filtered.map(t => <TableRow key={t.id}><TableCell className="pl-6 font-medium">{t.name}</TableCell><TableCell className="text-muted-foreground">{t.venue || 'Belum diisi'}</TableCell><TableCell className="text-muted-foreground">{t.date ? new Date(t.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Belum ditentukan'}</TableCell><TableCell><Badge variant="outline">{data.tiers.filter(tier => tier.tournament_id === t.id).length} tier</Badge></TableCell><TableCell className="pr-6 text-right"><Button variant="ghost" size="sm" render={<Link to={`/admintempo/tiers?tournament=${t.id}`} />}>Lihat tier<ArrowUpRight /></Button></TableCell></TableRow>)}</TableBody></Table> : <ListEmpty title={search ? 'Turnamen tidak ditemukan' : 'Belum ada turnamen'} description={search ? 'Coba gunakan kata pencarian lain.' : 'Tambahkan turnamen pertama untuk mulai mengatur tier, grup, dan pertandingan.'} />}</CardContent>
    </Card>
    <FormDialog open={open} onOpenChange={setOpen} title="Tambah turnamen" description="Isi informasi dasar turnamen. Tier dan peserta dapat ditambahkan setelahnya." busy={busy} onSubmit={save} submitLabel="Simpan turnamen"><FormSection title="Informasi turnamen"><Field label="Nama turnamen"><Input name="name" required maxLength={100} placeholder="Contoh: Tempo Padel Open" /></Field><Field label="Venue"><Input name="venue" maxLength={150} placeholder="Nama venue / klub" /></Field><Field label="Tanggal"><Input name="date" type="date" /></Field></FormSection></FormDialog>
  </div>
}
