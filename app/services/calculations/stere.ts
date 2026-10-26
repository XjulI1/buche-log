import type { LogSize } from '#shared/types'
import {
  LOG_SIZE_COEFFICIENTS,
  calculateSteres,
  calculateVolumeM3,
} from '#shared/utils/stere'

export { calculateSteres, calculateVolumeM3 }

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
