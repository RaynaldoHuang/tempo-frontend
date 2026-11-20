import { courtSchedule } from '@/lib/padel'
import { useState } from 'react'
import { SearchField, ListEmpty } from './page-parts'
import { ArrowRight, CircleDot, Settings2, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Data } from '@/lib/padel'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

export function MasterDataPage({ data }: { data: Data }) {
  const sections = [
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

export function CourtsPage({ data }: { data: Data }) {
  const [search, setSearch] = useState('')
  const filtered = data.courts.filter(court => court.name.toLowerCase().includes(search.toLowerCase()))
  return <div className="space-y-6">
    <PageHeader title="Court" description="Daftar lapangan yang tersedia untuk pertandingan. Kelola petugas melalui Penugasan wasit." action={<Button variant="outline" className="h-9" render={<Link to="/admintempo/assignments" />}>Penugasan wasit<ArrowRight /></Button>} />
    <Card className="gap-0 overflow-hidden"><CardHeader className="gap-4 pb-5"><div><CardTitle>Daftar court</CardTitle><CardDescription className="mt-1">{data.courts.length} court tersedia untuk live scoring</CardDescription></div><SearchField value={search} onChange={setSearch} placeholder="Cari nama court…" /></CardHeader><CardContent className="px-0">{filtered.length ? <Table><TableHeader><TableRow><TableHead className="pl-6">Court</TableHead><TableHead>Ketersediaan</TableHead><TableHead>Wasit bertugas</TableHead><TableHead className="pr-6">Pertandingan</TableHead></TableRow></TableHeader><TableBody>{filtered.map(court => {
      const current = courtSchedule(data.matches, court.id).current
      const match = current?.status === 'finished' ? undefined : current
      const referee = data.referees.find(user => user.id === court.referee_id)
      return <TableRow key={court.id}><TableCell className="pl-6"><span className="flex items-center gap-2 font-medium"><CircleDot className="size-4 text-muted-foreground" />{court.name}</span></TableCell><TableCell><Badge variant={match ? 'default' : 'secondary'}>{match ? 'Ada pertandingan' : 'Tersedia'}</Badge></TableCell><TableCell className="text-muted-foreground">{referee?.name || 'Belum ditugaskan'}</TableCell><TableCell className="pr-6 text-muted-foreground">{match ? `${match.team_a} vs ${match.team_b}` : 'Belum ada pertandingan'}</TableCell></TableRow>
    })}</TableBody></Table> : <ListEmpty title="Court tidak ditemukan" description="Coba gunakan nama court yang berbeda." />}</CardContent></Card>
  </div>
}
