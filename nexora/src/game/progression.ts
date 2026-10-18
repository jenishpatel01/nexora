import { rankBands } from '../data/nexo'

export const xpToNext = (level: number) => 240 + level * 20

export function levelInfo(xp: number) {
  let level = 1
  let rem = xp
  while (rem >= xpToNext(level)) { rem -= xpToNext(level); level++ }
  const need = xpToNext(level)
  return { level, into: rem, need, progress: rem / need }
}

export function cumulativeXp(level: number) {
  let t = 0
  for (let l = 1; l < level; l++) t += xpToNext(l)
  return t
}

export type RankInfo = {
  label: string
  band: string
  bandIndex: number
  division: '' | 'I' | 'II' | 'III'
  tier: number
  color: string
  floor: number
  nextAt: number
  nextLabel: string
  progress: number
  toNext: number
}

const divisionStarts = (from: number) => [from, from + 100, from + 150] as const

export function rankInfo(elo: number): RankInfo {
  let bandIndex = rankBands.length - 1
  for (let i = 0; i < rankBands.length; i++) {
    if (elo >= rankBands[i].from && elo <= rankBands[i].to) { bandIndex = i; break }
  }
  const band = rankBands[bandIndex]
  const isTop = bandIndex === rankBands.length - 1
  if (isTop) {
    return { label: band.name, band: band.name, bandIndex, division: '', tier: bandIndex * 3, color: band.color, floor: band.from, nextAt: band.from, nextLabel: band.name, progress: 1, toNext: 0 }
  }
  const [s3, s2, s1] = divisionStarts(band.from)
  const division = elo >= s1 ? 'I' : elo >= s2 ? 'II' : 'III'
  const floor = division === 'I' ? s1 : division === 'II' ? s2 : s3
  const nextAt = division === 'I' ? band.to + 1 : division === 'II' ? s1 : s2
  const nextBand = rankBands[bandIndex + 1]
  const nextLabel = division === 'I' ? `${nextBand.name} ${nextBand.name === 'Nexora Elite' ? '' : 'III'}`.trim() : `${band.name} ${division === 'II' ? 'I' : 'II'}`
  return {
    label: `${band.name} ${division}`, band: band.name, bandIndex, division,
    tier: bandIndex * 3 + (division === 'III' ? 0 : division === 'II' ? 1 : 2),
    color: band.color, floor, nextAt, nextLabel,
    progress: Math.max(0, Math.min(1, (elo - floor) / (nextAt - floor))),
    toNext: Math.max(0, nextAt - elo),
  }
}

export const eloExpected = (me: number, opp: number) => 1 / (1 + Math.pow(10, (opp - me) / 400))
export const eloDelta = (me: number, opp: number, score: 0 | 0.5 | 1, k = 48) => Math.round(k * (score - eloExpected(me, opp)))
