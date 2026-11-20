import { useState } from 'react'
import type { Submit, Tier } from '@/lib/padel'
import { AppSelect } from '@/components/shared/app-select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Field } from './form-fields'

export function ManualDrawEditor({ tier, initialSlots, revision, roundNames, confirmed, busy, online, submit, onClose, onSaved }: { tier: Tier; initialSlots: (string | null)[]; revision: string; roundNames: string[]; confirmed: boolean; busy: boolean; online: boolean; submit: Submit; onClose: () => void; onSaved: () => Promise<void> }) {
  const [slots, setSlots] = useState(initialSlots)
  const [confirming, setConfirming] = useState(false)
  const teams = tier.groups[0].teams
  const byeCount = slots.filter(team => team === null).length
  const invalid = slots.some((team, index) => index % 2 === 0 && team === null && slots[index + 1] === null)
  function choose(index: number, value: string) {
    const team = value === 'bye' ? null : teams[Number(value.slice(5))]
    if (team === undefined || slots[index] === team) return
    const other = slots.findIndex((item, position) => position !== index && item === team)
    if (other < 0) return
    setSlots(current => current.map((item, position) => position === index ? team : position === other ? current[index] : item))
  }
  return <>
    <Dialog open onOpenChange={value => { if (!value && !busy) onClose() }}><DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>Atur pertemuan · {tier.name}</DialogTitle><DialogDescription>Susun sesuai hasil undian manual Anda. Memilih pasangan yang sudah ada di slot lain akan menukar posisi keduanya.</DialogDescription></DialogHeader>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3"><span className="text-sm font-medium">{roundNames[0]} · {slots.length / 2} pertandingan</span><Badge variant="outline">{teams.length} pasangan · {byeCount} BYE</Badge></div>
      <p className="text-xs leading-relaxed text-muted-foreground">Pemenang pertandingan 1 bertemu pemenang pertandingan 2 di babak berikutnya; pertandingan 3 bertemu 4, dan seterusnya. Posisi unggulan dan BYE mengikuti susunan yang Anda simpan.</p>
      <div className="grid items-start gap-4 sm:grid-cols-2">{Array.from({ length: slots.length / 2 }, (_, matchIndex) => <section key={matchIndex} className="rounded-xl border p-4"><div className="mb-4 flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Pertandingan {matchIndex + 1}</h3>{(slots[matchIndex * 2] === null || slots[matchIndex * 2 + 1] === null) && <Badge variant="secondary">BYE</Badge>}</div>{[0, 1].map(side => {
        const index = matchIndex * 2 + side
        return <Field key={side} label={`Slot ${index + 1} · pasangan ${side === 0 ? 'A' : 'B'}`}><AppSelect disabled={busy} value={slots[index] === null ? 'bye' : `team:${teams.indexOf(slots[index]!)}`} onValueChange={value => choose(index, value)} options={[...(byeCount ? [{ value: 'bye', label: 'BYE · langsung maju' }] : []), ...teams.map((team, position) => ({ value: `team:${position}`, label: team }))]} /></Field>
      })}{roundNames[1] && <p className="mt-3 text-xs text-muted-foreground">Pemenang → {roundNames[1]} · {Math.floor(matchIndex / 2) + 1}</p>}</section>)}</div>
      {invalid && <p role="alert" className="text-sm text-destructive">BYE tidak boleh melawan BYE. Pindahkan salah satu pasangan ke pertandingan tersebut.</p>}
      <div className="sticky bottom-0 -mx-6 -mb-6 flex justify-end gap-2 border-t bg-background p-4"><Button variant="outline" disabled={busy} onClick={onClose}>Batal</Button><Button disabled={busy || !online || invalid} onClick={() => setConfirming(true)}>Simpan bagan manual</Button></div>
    </DialogContent></Dialog>
    <AlertDialog open={confirming} onOpenChange={setConfirming}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Simpan susunan pertemuan ini?</AlertDialogTitle><AlertDialogDescription>Susunan undian sebelumnya diganti sesuai pilihan Anda. Court dan urutan antrean mengikuti slot pertandingan; slot yang menjadi BYE tidak memakai court. {confirmed ? 'Bagan kembali ke preview dan perlu dikonfirmasi ulang sebelum pertandingan dimulai.' : 'Periksa preview lalu konfirmasi bagan sebelum pertandingan dimulai.'}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Periksa lagi</AlertDialogCancel><AlertDialogAction disabled={busy || !online || invalid} onClick={async () => { if (await submit(`/tiers/${tier.id}/draw`, { slots, revision })) { setConfirming(false); await onSaved() } }}>{busy ? 'Menyimpan…' : 'Simpan susunan'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>
}
