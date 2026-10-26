import type { LogSize } from '../types/rack'

/**
 * Coefficients de conversion selon la taille des buches
 * 1 stere = 1 m3 de bois empile avec des buches de 1m
 * Plus les buches sont petites, plus elles se tassent
 */
export const LOG_SIZE_COEFFICIENTS: Record<LogSize, number> = {
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
