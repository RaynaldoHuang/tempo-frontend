import { Plus, Trash2 } from 'lucide-react'
import { newPair, newGroup, groupLabel, participantErrors } from '@/lib/participants'
import type { ParticipantGroup } from '@/lib/participants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from './form-fields'

export function ParticipantsFields({ groups, onChange, format, drawMode = 'ordered' }: { groups: ParticipantGroup[]; onChange: (groups: ParticipantGroup[]) => void; format: string; drawMode?: string }) {
  const errors = participantErrors(groups)
  function addGroup() {
    const names = new Set(groups.map((group, index) => group.name ?? groupLabel(index, format)))
    let index = 0
    while (names.has(groupLabel(index, format))) index++
    onChange([...groups, { ...newGroup(), name: groupLabel(index, format) }])
  }
  function updatePlayer(groupId: string, pairId: string, player: number, value: string) {
    onChange(groups.map(group => group.id !== groupId ? group : { ...group, pairs: group.pairs.map(pair => pair.id !== pairId ? pair : { ...pair, players: pair.players.map((name, index) => index === player ? value : name) as [string, string] }) }))
  }
  return <div className="space-y-4">
    {groups.map((group, groupIndex) => <section key={group.id} className="overflow-hidden rounded-xl border" aria-label={(group.name ?? groupLabel(groupIndex, format))}>
      <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3"><div><h4 className="text-sm font-semibold">{(group.name ?? groupLabel(groupIndex, format))}</h4><p className="mt-1 text-xs text-muted-foreground">{group.pairs.length} pasangan · {group.pairs.length * 2} pemain</p></div>{format !== 'knockout' && <Button type="button" variant="ghost" size="icon" disabled={groups.length <= 1} aria-label={`Hapus ${(group.name ?? groupLabel(groupIndex, format))}`} onClick={() => { if (group.pairs.some(pair => pair.players.some(name => name.trim())) && !window.confirm(`Hapus ${(group.name ?? groupLabel(groupIndex, format))} beserta pemain yang sudah diisi?`)) return; onChange(groups.filter(item => item.id !== group.id)) }}><Trash2 /></Button>}</div>
      <div className="divide-y px-4">{group.pairs.map((pair, pairIndex) => <div key={pair.id} className="py-4">
        <div className="mb-3 flex items-center justify-between"><p className="text-xs font-medium text-muted-foreground">{format === 'knockout' ? `Peserta ${pairIndex + 1}${drawMode === 'ordered' && pairIndex < 2 ** Math.ceil(Math.log2(group.pairs.length)) - group.pairs.length ? ' · BYE' : ''}` : `Pasangan ${pairIndex + 1}`}</p>{format === 'group' && <Button type="button" variant="ghost" size="icon-sm" disabled={group.pairs.length <= 2} aria-label={`Hapus pasangan ${pairIndex + 1} dari ${(group.name ?? groupLabel(groupIndex, format))}`} onClick={() => { if (pair.players.some(name => name.trim()) && !window.confirm('Hapus pasangan beserta nama pemain yang sudah diisi?')) return; onChange(groups.map(item => item.id === group.id ? { ...item, pairs: item.pairs.filter(p => p.id !== pair.id) } : item)) }}><Trash2 /></Button>}</div>
        <div className="grid gap-x-4 sm:grid-cols-2">{pair.players.map((name, playerIndex) => {
          const errorId = `${pair.id}-${playerIndex}-error`
          const error = errors[`${pair.id}-${playerIndex}`]
          return <Field key={playerIndex} label={`Pemain ${playerIndex + 1}`}><Input required={playerIndex === 0 || !pair.originalTeam || pair.originalTeam.includes('/') || Boolean(name)} maxLength={48} pattern=".*\S.*" title="Isi nama pemain, bukan hanya spasi." autoComplete="off" placeholder={playerIndex === 0 ? 'Contoh: Andi Pratama' : 'Contoh: Budi Santoso'} value={name} onChange={event => updatePlayer(group.id, pair.id, playerIndex, event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} />{error && <span id={errorId} className="text-xs font-normal text-destructive">{error}</span>}</Field>
        })}</div>
      </div>)}</div>
      {format === 'group' && <div className="border-t px-4 py-3"><Button type="button" variant="outline" size="sm" disabled={group.pairs.length >= 16} onClick={() => onChange(groups.map(item => item.id === group.id ? { ...item, pairs: [...item.pairs, newPair()] } : item))}><Plus />Tambah pasangan</Button></div>}
    </section>)}
    {format !== 'knockout' && <div className="flex flex-wrap items-center justify-between gap-3"><Button type="button" variant="outline" disabled={groups.length >= 16} onClick={addGroup}><Plus />{format === 'group' ? 'Tambah grup' : 'Tambah pertandingan'}</Button><p className="text-xs text-muted-foreground">{groups.length}/16 {format === 'group' ? 'grup' : 'pertandingan'} · {groups.reduce((sum, group) => sum + group.pairs.length, 0)} pasangan</p></div>}
    <p className="text-xs leading-relaxed text-muted-foreground">{format === 'group' ? 'Setiap grup berisi 2–16 pasangan.' : format === 'knockout' ? 'Knockout langsung mendukung 2–64 pasangan. Pemenang maju otomatis setelah hasil dikonfirmasi wasit.' : 'Setiap pertandingan berisi tepat 2 pasangan.'} Gunakan nama lengkap atau pembeda untuk pemain dengan nama yang sama.</p>
  </div>
}
