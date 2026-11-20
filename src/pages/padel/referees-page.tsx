import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowUpRight, Eye, EyeOff, Pencil, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formValue as field } from '@/lib/padel'
import type { Data, Submit, User } from '@/lib/padel'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Field } from './form-fields'
import { FormDialog, FormSection, ListEmpty, SearchField } from './page-parts'

export function RefereesPage({ data, submit, busy }: { data: Data; submit: Submit; busy: boolean }) {
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  function changeOpen(value: boolean) { setOpen(value); setShowPassword(false) }
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<User | null>(null)
  const [editName, setEditName] = useState('')
  const filtered = data.referees.filter(user => `${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase()))
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (await submit('/referees', { name: field(form, 'name'), email: field(form, 'email'), password: String(form.get('password')) })) changeOpen(false)
  }
  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (editing && await submit(`/referees/${editing.id}`, { name: field(new FormData(event.currentTarget), 'name') }, 'PATCH')) { setEditing(null); setSearch('') }
  }
  return <div className="space-y-6"><PageHeader title="Wasit" description="Kelola akun wasit yang bertugas mencatat skor di lapangan." action={<Button className="h-9" onClick={() => changeOpen(true)}><Plus />Tambah wasit</Button>} />
    <Card className="gap-0 overflow-hidden"><CardHeader className="gap-4 pb-5"><div><CardTitle>Daftar wasit</CardTitle><CardDescription className="mt-1">{data.referees.length} akun · {data.courts.filter(c => c.referee_id).length} sedang ditugaskan</CardDescription></div><SearchField value={search} onChange={setSearch} placeholder="Cari nama atau email wasit…" /></CardHeader><CardContent className="px-0">{filtered.length ? <Table><TableHeader><TableRow><TableHead className="pl-6">Wasit</TableHead><TableHead>Email login</TableHead><TableHead>Penugasan</TableHead><TableHead className="pr-6 text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{filtered.map(user => { const court = data.courts.find(c => c.referee_id === user.id); return <TableRow key={user.id}><TableCell className="pl-6"><div className="flex items-center gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">{user.name.slice(0, 2).toUpperCase()}</span><span className="font-medium">{user.name}</span></div></TableCell><TableCell className="text-muted-foreground">{user.email}</TableCell><TableCell><Badge variant={court ? 'default' : 'secondary'}>{court?.name || 'Belum ditugaskan'}</Badge></TableCell><TableCell className="pr-6 text-right"><div className="flex justify-end gap-2"><Button variant="outline" size="sm" disabled={busy} aria-label={`Edit nama ${user.name}`} onClick={() => { setEditing(user); setEditName(user.name) }}><Pencil />Edit nama</Button><Button variant="ghost" size="sm" nativeButton={false} render={<Link to="/admintempo/assignments" />}>Atur penugasan<ArrowUpRight /></Button></div></TableCell></TableRow> })}</TableBody></Table> : <ListEmpty title={search ? 'Wasit tidak ditemukan' : 'Belum ada akun wasit'} description={search ? 'Coba gunakan nama atau email lain.' : 'Buat akun agar wasit dapat login dari HP dan mencatat skor.'} />}</CardContent></Card>
    <FormDialog open={open} onOpenChange={changeOpen} title="Tambah wasit" description="Buat akses login untuk petugas pencatat skor." busy={busy} onSubmit={save} submitLabel="Simpan akun wasit"><FormSection title="Identitas wasit"><Field label="Nama lengkap"><Input name="name" required maxLength={100} placeholder="Nama wasit" /></Field><Field label="Email login"><Input name="email" type="email" required placeholder="wasit@turnamen.com" /></Field></FormSection><FormSection title="Akses akun" description="Wasit dapat mengganti password setelah login."><div className="space-y-2"><Label htmlFor="referee-initial-password">Password awal</Label><div className="relative"><Input id="referee-initial-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={10} required placeholder="Minimal 10 karakter" className="h-9 pr-11" /><Button type="button" variant="ghost" size="icon" disabled={busy} className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} aria-controls="referee-initial-password" aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</Button></div></div></FormSection></FormDialog>
    <FormDialog open={Boolean(editing)} onOpenChange={value => { if (!value) setEditing(null) }} title="Edit nama wasit" description="Perbarui nama tampilan pada akun dan penugasan wasit." busy={busy} onSubmit={saveName} submitLabel="Simpan nama"><p className="text-xs text-muted-foreground">Akun: {editing?.email}</p><Field label="Nama lengkap"><Input name="name" required maxLength={100} autoFocus value={editName} onChange={event => setEditName(event.target.value)} placeholder="Nama lengkap wasit" /></Field></FormDialog>
  </div>
}
