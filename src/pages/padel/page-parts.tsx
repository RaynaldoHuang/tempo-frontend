import type { FormEvent, ReactNode } from 'react'
import { Inbox, LoaderCircle, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div className="relative w-full sm:max-w-xs"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-9 pl-9" type="search" aria-label={placeholder} placeholder={placeholder} value={value} onChange={event => onChange(event.target.value)} /></div>
}

export function ListEmpty({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center"><div className="mb-4 flex size-11 items-center justify-center rounded-xl border bg-muted/30"><Inbox className="size-5 text-muted-foreground" /></div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>{action && <div className="mt-5">{action}</div>}</div>
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="space-y-4 border-b pb-6 last:border-0 last:pb-0"><div><h3 className="text-sm font-semibold">{title}</h3>{description && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>}</div>{children}</section>
}

export function FormDialog({ open, onOpenChange, title, description, busy, onSubmit, children, submitLabel = 'Simpan', wide = false }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; busy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>; children: ReactNode; submitLabel?: string; wide?: boolean
}) {
  return <Dialog open={open} onOpenChange={next => { if (!busy) onOpenChange(next) }}><DialogContent className={`max-h-[90svh] gap-0 overflow-hidden p-0 ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`} showCloseButton={!busy}>
    <DialogHeader className="border-b p-6 pr-12"><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
    <form onSubmit={onSubmit} className="flex min-h-0 flex-col"><fieldset disabled={busy} className="min-w-0 max-h-[calc(90svh-13rem)] space-y-6 overflow-y-auto p-6">{children}</fieldset><div className="flex flex-col-reverse gap-2 border-t bg-muted/20 px-6 py-4 sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Batal</Button><Button type="submit" disabled={busy}>{busy && <LoaderCircle className="animate-spin" />}{busy ? 'Menyimpan…' : submitLabel}</Button></div></form>
  </DialogContent></Dialog>
}
