import { courtSchedule, queueMatches, formValue } from '@/lib/padel'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { SearchField, ListEmpty, FormDialog } from './page-parts'
import { ArrowRight, CircleDot, MapPin, Pencil, Plus, Settings2, Trash2, Users } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Court, Data, Submit } from '@/lib/padel'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Field } from './form-fields'
import { AppSelect } from '@/components/shared/app-select'
import { Input } from '@/components/ui/input'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

export function MasterDataPage({ data }: { data: Data }) {
  const sections = [
    { title: 'Venue', description: 'Lokasi turnamen dan pengelompokan court.', count: data.venues.length, href: '/admintempo/master-data/venues', icon: MapPin },
    { title: 'Court', description: 'Daftar lapangan yang tersedia untuk pertandingan.', count: data.courts.length, href: '/admintempo/master-data/courts', icon: CircleDot },
    { title: 'Wasit', description: 'Akun dan identitas petugas pencatat skor.', count: data.referees.length, href: '/admintempo/master-data/referees', icon: Users },
    { title: 'Preset skor', description: 'Format skor yang dapat digunakan kembali pada tiap tier.', count: data.presets.length, href: '/admintempo/master-data/presets', icon: Settings2 },
  ]
  return (
    <div className="space-y-6">
      <PageHeader title="Master Data" description="Data dasar yang digunakan oleh turnamen dan operasional pertandingan." />
      <div className="grid gap-4 md:grid-cols-3">
        {sections.map(section => (
          <Card key={section.href}>
            <CardHeader>
              <div className="flex items-center justify-between"><section.icon className="size-5 text-muted-foreground" /><Badge variant="secondary">{section.count} data</Badge></div>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent><Button variant="outline" render={<Link to={section.href} />}>Buka master data<ArrowRight /></Button></CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function CourtsPage({ data, submit, busy }: { data: Data; submit: Submit; busy: boolean }) {
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Court | null>(null)
  const [params, setParams] = useSearchParams()
  const venueFilter = params.get('venue') || ''
  const [deleting, setDeleting] = useState<Court | null>(null)
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (await submit(editing ? `/courts/${editing.id}` : '/courts', { name: formValue(form, 'name'), venue_id: Number(form.get('venue_id')) }, editing ? 'PATCH' : 'POST')) { setAdding(false); setEditing(null); setSearch('') }
  }
  const [search, setSearch] = useState('')
  const filtered = data.courts.filter(court => (!venueFilter || court.venue_id === Number(venueFilter)) && court.name.toLowerCase().includes(search.toLowerCase()))
  return <div className="space-y-6">
    <PageHeader title="Court" description="Daftar lapangan yang tersedia untuk pertandingan. Kelola petugas melalui Penugasan wasit." action={<div className="flex flex-wrap gap-2"><Button variant="outline" className="h-9" nativeButton={false} render={<Link to="/admintempo/assignments" />}>Penugasan wasit<ArrowRight /></Button><Button className="h-9" disabled={busy || !data.venues.length} onClick={() => { setEditing(null); setAdding(true) }}><Plus />Tambah court</Button></div>} />
    <Card className="gap-0 overflow-hidden"><CardHeader className="gap-4 pb-5"><div><CardTitle>Daftar court</CardTitle><CardDescription className="mt-1">{data.courts.length} court tersedia untuk live scoring</CardDescription></div><div className="flex flex-col gap-3 sm:flex-row"><SearchField value={search} onChange={setSearch} placeholder="Cari nama court…" /><AppSelect className="w-full sm:w-64" aria-label="Filter venue court" value={venueFilter} onValueChange={value => setParams(value ? { venue: value } : {})} options={[{ value: '', label: 'Semua venue' }, ...data.venues.map(venue => ({ value: venue.id, label: venue.name }))]} /></div></CardHeader><CardContent className="px-0">{filtered.length ? <Table><TableHeader><TableRow><TableHead className="pl-6">Court</TableHead><TableHead>Venue</TableHead><TableHead>Ketersediaan</TableHead><TableHead>Wasit bertugas</TableHead><TableHead>Pertandingan</TableHead><TableHead className="pr-6 text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{filtered.map(court => {
      const current = courtSchedule(queueMatches(data), court.id).current
      const match = current?.status === 'finished' ? undefined : current
      const referee = data.referees.find(user => user.id === court.referee_id)
      return <TableRow key={court.id}><TableCell className="pl-6"><span className="flex items-center gap-2 font-medium"><CircleDot className="size-4 text-muted-foreground" />{court.name}</span></TableCell><TableCell className="text-muted-foreground">{data.venues.find(venue => venue.id === court.venue_id)?.name || 'Belum ditentukan'}</TableCell><TableCell><Badge variant={match ? 'default' : 'secondary'}>{match ? 'Ada pertandingan' : 'Tersedia'}</Badge></TableCell><TableCell className="text-muted-foreground">{referee?.name || 'Belum ditugaskan'}</TableCell><TableCell className="text-muted-foreground">{match ? `${match.team_a} vs ${match.team_b}` : 'Belum ada pertandingan'}</TableCell><TableCell className="pr-6 text-right"><div className="flex justify-end gap-2"><Button variant="outline" size="sm" disabled={busy} onClick={() => { setEditing(court); setAdding(true) }}><Pencil />Ubah</Button><Button variant="destructive" size="sm" disabled={busy || Boolean(match)} title={match ? 'Selesaikan pertandingan atau pindahkan antrean sebelum menghapus court.' : `Hapus ${court.name}`} onClick={() => setDeleting(court)}><Trash2 />Hapus</Button></div></TableCell></TableRow>
    })}</TableBody></Table> : <ListEmpty title={search ? "Court tidak ditemukan" : "Belum ada court"} description={search ? "Coba gunakan nama court yang berbeda." : "Tambahkan court untuk menempatkan pertandingan dan menugaskan wasit."} />}</CardContent></Card>
    <p className="text-xs leading-relaxed text-muted-foreground">Court dapat dihapus setelah seluruh pertandingannya selesai atau antreannya dipindahkan. Hasil pertandingan tetap tersimpan.</p>
    <FormDialog open={adding} onOpenChange={setAdding} title={editing ? 'Ubah court' : 'Tambah court'} description="Setiap court berada di satu venue. Nama court boleh sama jika venue berbeda." busy={busy} onSubmit={save} submitLabel={editing ? 'Simpan perubahan' : 'Tambah court'}><Field label="Venue"><AppSelect name="venue_id" required defaultValue={editing?.venue_id ?? venueFilter} options={[{ value: '', label: 'Pilih venue', disabled: true }, ...data.venues.map(venue => ({ value: venue.id, label: venue.name }))]} /></Field><Field label="Nama court"><Input name="name" required maxLength={100} autoFocus defaultValue={editing?.name ?? ''} placeholder="Contoh: Court 1 atau Lapangan Utama" /></Field></FormDialog>
    <AlertDialog open={Boolean(deleting)} onOpenChange={value => { if (!value && !busy) setDeleting(null) }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus {deleting?.name}?</AlertDialogTitle><AlertDialogDescription>Court akan dihapus dari daftar dan layar TV. Penugasan wasit pada court ini dilepas. Hasil pertandingan tetap tersimpan, tanpa kaitan ke court yang dihapus.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={busy} onClick={async () => { if (deleting && await submit(`/courts/${deleting.id}`, undefined, 'DELETE')) setDeleting(null) }}><Trash2 />{busy ? 'Menghapus…' : 'Hapus court'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>
}
