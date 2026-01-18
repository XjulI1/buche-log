import { db } from '@/services/database/db'
import type { Rack, ConsumptionEntry } from '@/types'

interface ExportData {
  version: number
  exportDate: string
  racks: Rack[]
  consumptions: ConsumptionEntry[]
}

export function useExportImport() {
  async function exportData(): Promise<string> {
    const racks = await db.racks.toArray()
    const consumptions = await db.consumptions.toArray()

    const data: ExportData = {
      version: 1,
      exportDate: new Date().toISOString(),
      racks,
      consumptions,
    }

    return JSON.stringify(data, null, 2)
  }

  async function downloadExport() {
    const json = await exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `buche-log-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function importData(jsonString: string): Promise<{ racks: number; consumptions: number }> {
    const data: ExportData = JSON.parse(jsonString)

    if (!data.version || !data.racks || !data.consumptions) {
      throw new Error('Format de fichier invalide')
    }

    // Clear existing data
    await db.racks.clear()
    await db.consumptions.clear()

    // Convert date strings back to Date objects
    const racks = data.racks.map((r) => ({
      ...r,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
    }))

    const consumptions = data.consumptions.map((c) => ({
      ...c,
      date: new Date(c.date),
      createdAt: new Date(c.createdAt),
    }))

    // Import data
    await db.racks.bulkAdd(racks)
    await db.consumptions.bulkAdd(consumptions)

    return {
      racks: racks.length,
      consumptions: consumptions.length,
    }
  }

  async function importFromFile(file: File): Promise<{ racks: number; consumptions: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const result = await importData(e.target?.result as string)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'))
      reader.readAsText(file)
    })
  }

  async function resetAllData() {
    await db.racks.clear()
    await db.consumptions.clear()
  }

  return {
    exportData,
    downloadExport,
    importData,
    importFromFile,
    resetAllData,
  }
}
