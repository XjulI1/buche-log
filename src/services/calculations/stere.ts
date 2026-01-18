import type { LogSize } from '@/types'

/**
 * Coefficients de conversion selon la taille des buches
 * 1 stere = 1 m3 de bois empile avec des buches de 1m
 * Plus les buches sont petites, plus elles se tassent
 */
const LOG_SIZE_COEFFICIENTS: Record<LogSize, number> = {
  25: 0.6,
  33: 0.7,
  50: 0.8,
}

/**
 * Calcule le volume en metres cubes
 */
export function calculateVolumeM3(heightCm: number, widthCm: number, depthCm: number): number {
  return (heightCm * widthCm * depthCm) / 1_000_000
}

/**
 * Calcule le volume en steres
 * Formule: Volume(m3) / Coefficient(taille buches)
 */
export function calculateSteres(
  heightCm: number,
  widthCm: number,
  depthCm: number,
  logSize: LogSize,
): number {
  const volumeM3 = calculateVolumeM3(heightCm, widthCm, depthCm)
  const coefficient = LOG_SIZE_COEFFICIENTS[logSize]
  return volumeM3 / coefficient
}

/**
 * Calcule la consommation en steres pour un pourcentage donne
 */
export function calculateConsumptionSteres(totalSteres: number, percentageUsed: number): number {
  return (totalSteres * percentageUsed) / 100
}

/**
 * Calcule les steres restants pour un niveau donne
 */
export function calculateRemainingSteres(totalSteres: number, currentLevel: number): number {
  return (totalSteres * currentLevel) / 100
}

/**
 * Retourne le coefficient pour une taille de buche donnee
 */
export function getLogSizeCoefficient(logSize: LogSize): number {
  return LOG_SIZE_COEFFICIENTS[logSize]
}
