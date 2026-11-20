import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Plus, Power } from 'lucide-react'
import { formValue } from '@/lib/padel'
import type { Data, Submit } from '@/lib/padel'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Field } from './form-fields'
import { FormDialog, ListEmpty, SearchField } from './page-parts'

export function VenuesPage({ data, submit, busy }: { data: Data; submit: Submit; busy: boolean }) {
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')
  const filtered = data.venues.filter(venue => venue.name.toLowerCase().includes(search.toLowerCase()))
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (await submit('/venues', { name: formValue(new FormData(event.currentTarget), 'name') })) { setAdding(false); setSearch('') }
  }
  return <div className="space-y-6"><PageHeader title="Venue" description="Kelompokkan court berdasarkan lokasi. Aktifkan venue yang boleh tampil di layar TV publik." action={<Button disabled={busy} onClick={() => setAdding(true)}><Plus />Tambah venue</Button>} /><SearchField value={search} onChange={setSearch} placeholder="Cari nama venue…" />{filtered.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(venue => <Card key={venue.id}><CardHeader><div className="mb-2 flex items-center justify-between gap-3"><MapPin className="size-5 text-muted-foreground" /><Badge variant={venue.is_active ? 'default' : 'secondary'}>{venue.is_active ? 'Aktif di TV' : 'Tidak tampil di TV'}</Badge></div><CardTitle>{venue.name}</CardTitle><CardDescription>{data.courts.filter(court => court.venue_id === venue.id).length} court · {data.tournaments.filter(t => t.venue_id === venue.id).length} turnamen</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-2"><Button variant={venue.is_active ? 'outline' : 'default'} disabled={busy} onClick={() => void submit(`/venues/${venue.id}`, { is_active: !venue.is_active }, 'PATCH')}><Power />{venue.is_active ? 'Nonaktifkan dari TV' : 'Aktifkan di TV'}</Button><Button variant="outline" nativeButton={false} render={<Link to={`/admintempo/master-data/courts?venue=${venue.id}`} />}>Kelola court<ArrowRight /></Button></CardContent></Card>)}</div> : <Card><ListEmpty title={search ? 'Venue tidak ditemukan' : 'Belum ada venue'} description="Tambahkan venue sebelum mengatur court dan membuat turnamen." /></Card>}<FormDialog open={adding} onOpenChange={setAdding} title="Tambah venue" description="Venue baru belum tampil di TV. Setelah court siap, gunakan tombol Aktifkan di TV." busy={busy} onSubmit={save} submitLabel="Simpan venue"><Field label="Nama venue / klub"><Input name="name" required maxLength={150} autoFocus placeholder="Contoh: Tempo Padel Club" /></Field></FormDialog></div>
}
