import { uid } from '@/lib/padel'

export type PlayerPair = { id: string; players: [string, string] }
export type ParticipantGroup = { id: string; pairs: PlayerPair[] }
export const newPair = (): PlayerPair => ({ id: uid(), players: ['', ''] })
export const newGroup = (): ParticipantGroup => ({ id: uid(), pairs: [newPair(), newPair()] })
const normalize = (name: string) => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('id-ID')
export const groupLabel = (index: number, format: string) => format === 'group' ? `Grup ${String.fromCharCode(65 + index)}` : format === 'knockout' ? 'Peserta knockout' : `Pertandingan ${index + 1}`

export function participantErrors(groups: ParticipantGroup[]) {
  const counts = new Map<string, number>()
  for (const group of groups) for (const pair of group.pairs) for (const name of pair.players) {
    const key = normalize(name)
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const errors: Record<string, string> = {}
  for (const group of groups) for (const pair of group.pairs) pair.players.forEach((name, index) => {
    if (!name.trim()) return
    if (name.includes('/')) errors[`${pair.id}-${index}`] = 'Isi satu nama pemain tanpa tanda /.'
    else if ((counts.get(normalize(name)) ?? 0) > 1) errors[`${pair.id}-${index}`] = 'Nama sudah digunakan. Tambahkan pembeda jika orangnya berbeda.'
  })
  return errors
}
