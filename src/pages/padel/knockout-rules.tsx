import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { rulesLabel } from '@/lib/padel'
import type { Data, Rules, Submit, Tier } from '@/lib/padel'
import { Button } from '@/components/ui/button'
import { AppSelect } from '@/components/shared/app-select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, RulesFields } from './form-fields'
import { FormDialog } from './page-parts'

export function KnockoutRules({ tier, data, submit, busy, online, onSaved }: { tier: Tier; data: Data; submit: Submit; busy: boolean; online: boolean; onSaved: () => Promise<void> }) {
  const current = tier.knockout?.rules ?? tier.rules
  const [draft, setDraft] = useState<{ rules: Rules; revision: string } | null>(null)
  const [preset, setPreset] = useState('')
  const started = data.matches.filter(match => match.tier_id === tier.id && match.stage === 'knockout' && (match.status !== 'scheduled' || match.started_at)).length
  return <>
    <Card><CardHeader><div className="flex flex-wrap items-start justify-between gap-4"><div><CardTitle>Aturan pertandingan knockout</CardTitle><CardDescription className="mt-2">Atur jumlah set, game, dan tie-break khusus fase knockout.</CardDescription></div><Button variant="outline" disabled={busy || !online || !tier.edit_revision} onClick={() => { setPreset(''); setDraft({ rules: { ...current }, revision: tier.edit_revision! }) }}><Pencil />Ubah aturan knockout</Button></div></CardHeader><CardContent className="space-y-3"><p className="text-sm">{rulesLabel(current)}</p><p className="text-xs leading-relaxed text-muted-foreground">Berlaku untuk match knockout yang belum dimulai dan babak berikutnya. Aturan dan hasil fase grup tetap tersimpan.{started > 0 ? ` ${started} match yang sudah dimulai atau selesai tetap memakai aturan sebelumnya.` : ''}</p></CardContent></Card>
    <FormDialog open={Boolean(draft)} onOpenChange={open => { if (!open) setDraft(null) }} title="Aturan pertandingan knockout" description="Pilih 2 set + super tie-break saat 1–1 untuk format dua set. Perubahan berlaku pada pertandingan yang belum dimulai." busy={busy} wide onSubmit={async event => { event.preventDefault(); if (draft && online && await submit(`/tiers/${tier.id}/knockout-rules`, { rules: draft.rules, edit_revision: draft.revision })) { setDraft(null); await onSaved() } }} submitLabel="Simpan aturan knockout">
      {draft && <><Field label="Preset skor"><AppSelect value={preset} onValueChange={value => { setPreset(value); const selected = data.presets.find(item => item.id === Number(value)); if (selected) setDraft({ ...draft, rules: { ...selected.rules } }) }} options={[{ value: '', label: 'Pengaturan kustom' }, ...data.presets.map(item => ({ value: item.id, label: item.name }))]} /></Field><RulesFields rules={draft.rules} onChange={rules => { setPreset(''); setDraft({ ...draft, rules }) }} /><p className="rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed">{rulesLabel(draft.rules)}</p>{!online && <p role="alert" className="text-sm text-destructive">Koneksi terputus. Tunggu tersambung sebelum menyimpan.</p>}</>}
    </FormDialog>
  </>
}
