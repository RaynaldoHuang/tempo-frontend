import { rulesLabel, statuses } from './padel'
import type { Match, Rules } from './padel'

export type ReportMatch = Pick<Match, 'id' | 'stage' | 'group_name' | 'team_a' | 'team_b' | 'status' | 'rules' | 'started_at' | 'finished_at'> & {
  court_name: string | null; winner: string | null
  state: Omit<Match['state'], 'sets'> & { sets: { games: number[]; kind: string; winner: number; tiebreak?: number[] | null }[] }
}
type Summary = { total: number; finished: number; live: number; paused: number; review: number; scheduled: number }
type Standing = { name: string; unresolved: boolean; rows: { team: string; played: number; wins: number; sets: number; games: number }[] }
export type ReportCategory = {
  id: number; name: string; format: string; tournament: string; venue: string | null; participants: number
  summary: Summary; total_matches: number; champion: string | null; rules: Rules; knockout_rules: Rules; matches: ReportMatch[]
  standings: { complete: boolean; confirmed: boolean; qualifiers: number; groups: Standing[] } | null
  bracket_confirmed: boolean
  bracket: { name: string; matches: { a: { label: string; team: string | null }; b: { label: string; team: string | null }; winner: string | null; bye: boolean; match: ReportMatch | null; court_name: string | null }[] }[]
}
export type TournamentReport = { generated_at: string; timezone: string; period: string; start_date: string | null; end_date: string; sections: { results: boolean; standings: boolean; bracket: boolean }; summary: Summary; categories: ReportCategory[] }

const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
const dateTime = (value?: string | null) => value ? new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) + ' WIB' : '-'
const signed = (value: number) => value > 0 ? `+${value}` : String(value)

function points(match: ReportMatch, side: number) {
  const score = match.state.points
  if (match.state.mode !== 'regular') return String(score[side])
  if (score[0] >= 3 && score[1] >= 3) return score[side] > score[1 - side] ? 'AD' : '40'
  return ['0', '15', '30', '40'][Math.min(score[side], 3)]
}

function score(match: ReportMatch) {
  const sets = match.state.sets.map(set => `${set.games.join('-')}${set.kind === 'super' ? ' STB' : set.tiebreak ? ` (TB ${set.tiebreak.join('-')})` : ''}`).join(' / ')
  const current = ['live', 'paused'].includes(match.status) && match.state.winner === null ? `<small>Berjalan: game ${escape(match.state.games.join('-'))}; poin ${escape(points(match, 0))}-${escape(points(match, 1))}${match.state.mode === 'super' ? ' STB' : match.state.mode === 'tiebreak' ? ' TB' : ''}</small>` : ''
  return `${escape(sets || '-')}${current}`
}

function outcome(match: ReportMatch) {
  return `<span class="status">${escape(statuses[match.status] ?? match.status)}</span>${match.winner ? `<small class="winner">Menang: ${escape(match.winner)}</small>` : match.status === 'review' ? '<small>Hasil belum dikonfirmasi</small>' : ''}`
}

function matchTable(matches: ReportMatch[]) {
  if (!matches.length) return '<p class="empty">Tidak ada pertandingan pada periode yang dipilih.</p>'
  return `<table class="results"><colgroup><col style="width:13%"><col style="width:18%"><col style="width:18%"><col style="width:19%"><col style="width:16%"><col style="width:6%"><col style="width:10%"></colgroup><thead><tr><th>Babak / Grup</th><th>Pasangan A</th><th>Pasangan B</th><th>Skor A-B per set</th><th>Status / Pemenang</th><th>Court</th><th>Waktu WIB</th></tr></thead><tbody>${matches.map(match => `<tr><td>${escape(match.group_name)}<small>${match.stage === 'knockout' ? 'Knockout' : 'Fase grup / lepas'} · #${match.id}</small></td><td>${escape(match.team_a)}</td><td>${escape(match.team_b)}</td><td>${score(match)}</td><td>${outcome(match)}</td><td>${escape(match.court_name ?? '-')}</td><td>${escape(dateTime(match.finished_at ?? match.started_at))}<small>${match.finished_at ? 'Selesai' : match.started_at ? 'Mulai' : 'Belum mulai'}</small></td></tr>`).join('')}</tbody></table>`
}

function standings(category: ReportCategory) {
  if (!category.standings) return '<p class="empty">Kategori ini tidak menggunakan fase grup.</p>'
  const standing = category.standings
  return `<p class="note">${standing.complete ? 'Seluruh hasil grup selesai.' : 'Klasemen sementara; fase grup belum selesai.'} ${standing.qualifiers} pasangan teratas per grup ${standing.confirmed ? 'lolos knockout' : 'calon peserta lolos'}.</p>${standing.groups.map(group => `<section class="group"><h3>${escape(group.name)}</h3>${group.unresolved ? '<p class="warning">Peringkat seri belum ditetapkan panitia. Posisi lolos belum final.</p>' : ''}<table><colgroup><col style="width:5%"><col style="width:55%"><col style="width:10%"><col style="width:10%"><col style="width:10%"><col style="width:10%"></colgroup><thead><tr><th>#</th><th>Pasangan</th><th>Main</th><th>Menang</th><th>Selisih set</th><th>Selisih game</th></tr></thead><tbody>${group.rows.map((row, i) => `<tr><td>${i + 1}</td><td>${escape(row.team)}</td><td>${row.played}</td><td>${row.wins}</td><td>${signed(row.sets)}</td><td>${signed(row.games)}</td></tr>`).join('')}</tbody></table></section>`).join('')}`
}

function bracket(category: ReportCategory) {
  if (!category.bracket_confirmed) return '<p class="empty">Bagan knockout belum dikonfirmasi. Preview bukan hasil resmi.</p>'
  return `<p class="note">Jalur mengikuti bagan tersimpan, termasuk koreksi panitia. Label sumber menunjukkan pemenang pertandingan yang mengisi babak berikutnya. BYE tidak dihitung sebagai pertandingan.</p>${category.bracket.map((round, r) => `<section><h3>${escape(round.name)} · R${r + 1}</h3><table><colgroup><col style="width:6%"><col style="width:25%"><col style="width:25%"><col style="width:18%"><col style="width:20%"><col style="width:6%"></colgroup><thead><tr><th>Slot</th><th>Pasangan A / Sumber</th><th>Pasangan B / Sumber</th><th>Skor A-B</th><th>Status / Pemenang</th><th>Court</th></tr></thead><tbody>${round.matches.map((node, i) => `<tr><td>${i + 1}</td><td>${escape(node.a.team ?? (node.a.label === 'BYE' ? 'BYE' : 'Menunggu pemenang'))}<small>${escape(node.a.label)}</small></td><td>${escape(node.b.team ?? (node.b.label === 'BYE' ? 'BYE' : 'Menunggu pemenang'))}<small>${escape(node.b.label)}</small></td><td>${node.match ? score(node.match) : '-'}</td><td>${node.bye ? `BYE - langsung lolos<small class="winner">${escape(node.winner ?? '-')}</small>` : node.match ? outcome(node.match) : 'Menunggu peserta'}</td><td>${escape(node.court_name ?? '-')}</td></tr>`).join('')}</tbody></table></section>`).join('')}`
}

export function reportHtml(report: TournamentReport): string {
  const period = report.period === 'all' ? 'Seluruh turnamen sampai waktu ekspor' : `${report.start_date} s.d. ${report.end_date} (WIB)`
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Rekap Turnamen Tempo - ${escape(report.end_date)}</title><style>
    @page{size:A4 landscape;margin:12mm;@bottom-right{content:"Halaman " counter(page) " / " counter(pages);font:9px Arial;color:#536159}}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#172120;background:#eef1ef;margin:0;font-size:11px;line-height:1.45}.toolbar{position:sticky;top:0;background:#142d25;color:white;padding:14px 24px;display:flex;gap:16px;align-items:center;z-index:2}.toolbar span{flex:1}.toolbar button{border:1px solid #c8d5cd;border-radius:6px;padding:9px 14px;background:white;color:#142d25;font-weight:600;cursor:pointer}.paper{max-width:1100px;margin:24px auto;padding:36px;background:white}.eyebrow{text-transform:uppercase;letter-spacing:2px;color:#527064;font-size:10px;font-weight:bold}h1{font-size:30px;line-height:1.15;margin:8px 0 16px}h2{font-size:18px;margin:24px 0 10px}h3{font-size:13px;margin:18px 0 7px}h1,h2,h3{break-after:avoid}.meta,.note{color:#536159}.meta{margin-bottom:18px}.note,.empty{font-size:10px}.stats{display:flex;border:1px solid #cbd5cf;margin:20px 0}.stat{flex:1;padding:12px;border-right:1px solid #cbd5cf}.stat:last-child{border:0}.stat b{display:block;font-size:23px;color:#173f2e}.stat span{color:#536159;font-size:10px}table{border-collapse:collapse;width:100%;table-layout:fixed;margin:7px 0 18px}th{background:#eaf0ec;text-align:left;font-size:10px;color:#284536}th,td{border:1px solid #cbd5cf;padding:7px 8px;vertical-align:top;overflow-wrap:anywhere}thead{display:table-header-group}tr{break-inside:avoid}small{display:block;font-size:9px;color:#5d6861;margin-top:3px}.winner{color:#173f2e;font-weight:bold}.status{font-size:10px;font-weight:bold}.champion{border-left:4px solid #317354;background:#eff6f0;padding:12px 16px;font-size:14px;margin:16px 0}.category{break-before:page;border-top:2px solid #204b36;padding-top:12px;margin-top:36px}.warning{color:#784f08;background:#fff7e4;padding:8px}.group{break-inside:avoid}.footer{border-top:1px solid #cbd5cf;padding-top:10px;margin-top:24px;font-size:9px;color:#536159}@media print{body{background:white}.toolbar{display:none}.paper{max-width:none;margin:0;padding:0}.category{margin-top:0}.stats,th,.champion{print-color-adjust:exact;-webkit-print-color-adjust:exact}a{color:inherit;text-decoration:none}}
  </style></head><body><div class="toolbar"><span>Laporan siap. Klik Cetak / Simpan PDF, lalu pilih tujuan “Simpan sebagai PDF”. Gunakan kertas A4 lanskap.</span><button id="print-report" type="button">Cetak / Simpan PDF</button></div><main class="paper"><div class="eyebrow">Tempo Padel · Laporan panitia</div><h1>Rekap Pertandingan Turnamen</h1><div class="meta">${escape(period)}<br>Dibuat: ${escape(dateTime(report.generated_at))}<br>${report.categories.length} kategori · hasil terkonfirmasi dan progres pertandingan</div>
  <div class="stats">${[[report.summary.total, 'Match dalam periode'], [report.summary.finished, 'Selesai'], [report.summary.live + report.summary.paused, 'Berlangsung / jeda'], [report.summary.review, 'Konfirmasi hasil'], [report.summary.scheduled, 'Terjadwal']].map(([value, label]) => `<div class="stat"><b>${value}</b><span>${label}</span></div>`).join('')}</div>
  ${report.period !== 'all' ? '<p class="warning">Periode memfilter daftar hasil berdasarkan waktu selesai, atau waktu mulai untuk match yang belum selesai. Match yang belum mulai tidak masuk daftar periode. Klasemen, juara, dan jalur knockout selalu menunjukkan keseluruhan data sampai waktu ekspor, bukan kondisi historis pada tanggal akhir.</p>' : '<p class="note">Match terjadwal dan belum selesai tetap dicantumkan. Pemenang hanya dinyatakan resmi setelah hasil dikonfirmasi wasit.</p>'}
  <h2>Ringkasan kategori</h2><table><thead><tr><th>Turnamen / Venue</th><th>Kategori</th><th>Pasangan</th><th>Match periode / total</th><th>Selesai</th><th>Juara sampai waktu ekspor</th></tr></thead><tbody>${report.categories.map(category => `<tr><td>${escape(category.tournament)}<small>${escape(category.venue ?? '-')}</small></td><td>${escape(category.name)}</td><td>${category.participants}</td><td>${category.summary.total} / ${category.total_matches}</td><td>${category.summary.finished}</td><td>${escape(category.champion ?? 'Belum ditentukan')}</td></tr>`).join('') || '<tr><td colspan="6">Belum ada kategori pada pilihan ini.</td></tr>'}</tbody></table>
  ${report.categories.map(category => `<article class="category"><div class="eyebrow">${escape(category.tournament)} · ${escape(category.venue ?? '')}</div><h1>${escape(category.name)}</h1><p class="meta">${category.participants} pasangan · ${category.summary.finished}/${category.summary.total} match periode selesai<br>Aturan ${category.format === 'group' ? 'grup' : 'utama'}: ${escape(rulesLabel(category.rules))}<br>Aturan knockout: ${escape(rulesLabel(category.knockout_rules))}</p>${category.champion ? `<div class="champion">Juara: <strong>${escape(category.champion)}</strong></div>` : ''}${report.sections.results ? `<h2>Hasil & status pertandingan</h2><p class="note">Skor ditulis dari sisi pasangan A ke B. TB = tie-break; STB = super tie-break. Skor match berjalan masih sementara.</p>${matchTable(category.matches)}` : ''}${report.sections.standings ? `<h2>Klasemen grup sampai waktu ekspor</h2>${standings(category)}` : ''}${report.sections.bracket ? `<h2>Jalur knockout sampai waktu ekspor</h2>${bracket(category)}` : ''}</article>`).join('')}
  <div class="footer">Tempo Padel · Rekap dibuat ${escape(dateTime(report.generated_at))}. Data pertandingan dapat berubah setelah laporan dibuat.</div></main></body></html>`
}

export function showReport(target: Window, report: TournamentReport) {
  target.document.open()
  target.document.write(reportHtml(report))
  target.document.close()
  target.document.getElementById('print-report')?.addEventListener('click', () => { target.focus(); target.print() })
  target.focus()
}
