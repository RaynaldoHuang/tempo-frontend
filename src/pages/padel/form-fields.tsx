import type { ReactNode } from 'react'
import { ShieldCheck } from 'lucide-react'
import { deuceRule } from '@/lib/padel'
import type { Rules } from '@/lib/padel'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AppSelect } from '@/components/shared/app-select'

export function Field({ label, children }: { label: string; children: ReactNode }) { return <Label className="mb-4 flex flex-col items-stretch gap-2 text-sm leading-normal last:mb-0 [&_[data-slot=input]]:h-9 [&_[data-slot=select-trigger]]:h-9"><span>{label}</span>{children}</Label> }

export function RulesFields({ rules, onChange }: { rules: Rules; onChange: (rules: Rules) => void }) {
  const number = (key: keyof Rules, value: string) => onChange({ ...rules, [key]: Number(value), ...(key === 'games_to_win' && rules.tiebreak_at ? { tiebreak_at: Math.min(rules.tiebreak_at, Number(value)) } : {}) })
  return <div className="grid gap-x-4 sm:grid-cols-2">
    <Field label="Set reguler"><AppSelect className="w-full" value={rules.regular_sets} onValueChange={value => number('regular_sets', value)} options={[{ value: 2, label: '2 set + super tie-break saat 1–1' }, { value: 1, label: '1 set saja' }]} /></Field>
    <Field label="Target game per set"><Input required type="number" min={2} max={9} value={rules.games_to_win} onChange={e => number('games_to_win', e.target.value)} /></Field>
    <Field label="Aturan deuce"><AppSelect className="w-full" value={deuceRule(rules)} onValueChange={value => onChange({ ...rules, golden_point: value === 'golden', deuce_rule: value as NonNullable<Rules['deuce_rule']> })} options={[{ value: 'advantage', label: 'Advantage · selisih 2 poin' }, { value: 'golden', label: 'Golden point · poin penentu' }, { value: 'one_advantage', label: 'Satu kali advantage → golden point' }]} /></Field>
    <Field label="Mulai tie-break saat game"><AppSelect className="w-full" value={rules.tiebreak_at ?? rules.games_to_win} onValueChange={value => onChange({ ...rules, tiebreak_at: Number(value) === rules.games_to_win ? null : Number(value) })} options={Array.from({ length: Math.max(1, rules.games_to_win - 1) }, (_, i) => ({ value: i + 2, label: `${i + 2}–${i + 2}` }))} /></Field>
    <Field label={`Target poin tie-break saat ${rules.tiebreak_at ?? rules.games_to_win}–${rules.tiebreak_at ?? rules.games_to_win}`}><Input required type="number" min={5} max={21} value={rules.tiebreak_points} onChange={e => number('tiebreak_points', e.target.value)} /></Field>
    <Field label="Kemenangan tie-break"><AppSelect className="w-full" value={rules.tiebreak_win_by_two === false ? 'first' : 'two'} onValueChange={value => onChange({ ...rules, tiebreak_win_by_two: value === 'two' })} options={[{ value: 'two', label: 'Harus selisih 2 poin' }, { value: 'first', label: 'Siapa duluan mencapai target' }]} /></Field>
    {rules.regular_sets === 2 && <>
      <Field label="Target super tie-break"><Input required type="number" min={7} max={21} value={rules.super_points} onChange={e => number('super_points', e.target.value)} /></Field>
      <Field label="Kemenangan super tie-break"><AppSelect className="w-full" value={rules.super_win_by_two === false ? 'first' : 'two'} onValueChange={value => onChange({ ...rules, super_win_by_two: value === 'two' })} options={[{ value: 'two', label: 'Harus selisih 2 poin' }, { value: 'first', label: 'Siapa duluan mencapai target' }]} /></Field>
    </>}
    <div className="flex items-start gap-2 pb-4 sm:col-span-2 text-xs leading-relaxed text-muted-foreground"><ShieldCheck size={20} /><span>{deuceRule(rules) === 'one_advantage' ? 'Pada 40–40, mainkan advantage sekali. Jika kembali deuce, poin berikutnya langsung menentukan game.' : 'Game mengikuti aturan deuce.'} Tie-break {rules.tiebreak_win_by_two === false ? `langsung dimenangkan yang lebih dulu mencapai ${rules.tiebreak_points} poin, tanpa selisih 2` : 'membutuhkan selisih 2 poin'}. {rules.regular_sets === 2 && <>Super tie-break {rules.super_win_by_two === false ? `langsung dimenangkan yang lebih dulu mencapai ${rules.super_points} poin, tanpa selisih 2` : 'membutuhkan selisih 2 poin'}. </>} Aturan tersimpan pada pertandingan dan terkunci saat mulai.</span></div>
  </div>
}
