import { uid } from '@/lib/padel'

export type PlayerPair = { id: string; players: [string, string]; originalTeam?: string; originalPlayers?: [string, string] }
export type ParticipantGroup = { id: string; name?: string; pairs: PlayerPair[] }
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

export function editableGroups(groups: { name: string; teams: string[] }[]): ParticipantGroup[] {
  return groups.map(group => ({ id: uid(), name: group.name, pairs: group.teams.map(team => {
    const separator = team.indexOf('/')
    const players: [string, string] = separator < 0 ? [team, ''] : [team.slice(0, separator).trim(), team.slice(separator + 1).trim()]
    return { id: uid(), players, originalPlayers: [...players], originalTeam: team }
  }) }))
}
export function serializeGroups(groups: ParticipantGroup[], format: string) {
  return groups.map((group, index) => ({ name: group.name ?? groupLabel(index, format), teams: group.pairs.map(pair => pair.originalTeam && pair.originalPlayers?.every((player, index) => player === pair.players[index]) ? pair.originalTeam : pair.players.map(name => name.trim().replace(/\s+/g, ' ')).filter(Boolean).join(' / ')) }))
}
