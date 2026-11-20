export function Connection({ error, updated }: { error: string; updated: number }) {
  return <span className={`inline-flex items-center gap-2 text-xs ${error ? 'text-destructive' : 'text-muted-foreground'}`}><span className={`size-1.5 shrink-0 rounded-full ${error ? 'bg-destructive' : 'bg-primary'}`} />{error ? 'Koneksi terputus · mencoba lagi' : updated ? 'Terhubung · sinkron otomatis' : 'Menghubungkan…'}</span>
}

