import { courtSchedule } from '@/lib/padel'
import { CircleDot, Smartphone, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Data, Submit } from '@/lib/padel'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AppSelect } from '@/components/shared/app-select'
import { Field } from './form-fields'

export function AssignmentsPage({ data, submit, busy }: { data: Data; submit: Submit; busy: boolean }) {
  const assigned = data.courts.filter(court => court.referee_id).length
  return <div className="space-y-6"><PageHeader title="Penugasan wasit" description="Tempatkan satu wasit di setiap court. Perubahan langsung muncul pada akun wasit." action={<><Button variant="outline" className="h-9" render={<Link to="/admintempo/wasit-preview" />}><Smartphone />Lihat tampilan wasit</Button><Button variant="outline" className="h-9" render={<Link to="/admintempo/master-data/referees" />}><Users />Kelola wasit</Button></>} />
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/20 px-5 py-4"><span className="text-sm font-medium">Kesiapan court</span><Badge variant="secondary">{assigned} dari {data.courts.length} ditugaskan</Badge><span className="text-xs text-muted-foreground sm:ml-auto">{data.courts.length - assigned} court menunggu wasit</span></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.courts.map(court => {
      const referee = data.referees.find(user => user.id === court.referee_id)
      const current = courtSchedule(data.matches, court.id).current
      const match = current?.status === 'finished' ? undefined : current
      return <Card key={court.id}><CardHeader><div className="flex items-center justify-between gap-2"><CardTitle className="flex items-center gap-2"><CircleDot className="size-4 text-muted-foreground" />{court.name}</CardTitle><Badge variant={referee ? 'default' : 'secondary'}>{referee ? 'Ditugaskan' : 'Menunggu'}</Badge></div><CardDescription>{match ? `${match.team_a} vs ${match.team_b}` : 'Belum ada pertandingan terjadwal'}</CardDescription></CardHeader><CardContent className="space-y-3 border-t pt-5"><Field label="Wasit bertugas"><AppSelect className="w-full" aria-label={`Wasit ${court.name}`} value={court.referee_id || ''} disabled={busy} onValueChange={value => void submit(`/courts/${court.id}`, { referee_id: value ? Number(value) : null }, 'PATCH')} options={[{ value: '', label: 'Belum ditugaskan' }, ...data.referees.map(user => ({ value: user.id, label: user.name, disabled: data.courts.some(other => other.id !== court.id && other.referee_id === user.id) }))]} /></Field><p className="text-xs text-muted-foreground">{referee?.email || 'Pilih akun wasit untuk mengaktifkan pencatatan skor.'}</p></CardContent></Card>
    })}</div>
  </div>
}
