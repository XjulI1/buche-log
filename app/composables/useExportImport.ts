import { apiClient } from '~/services/api'
import type { ExportData, ImportResult } from '#shared/types'

export function useExportImport() {
  async function exportData(): Promise<string> {
    return JSON.stringify(await apiClient.exportData(), null, 2)
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

  /** Remplace les donnees du compte par celles du fichier (la conversion v1 est faite par le serveur) */
  async function importData(jsonString: string): Promise<ImportResult> {
    const data: ExportData = JSON.parse(jsonString)

    if (!data.version || !data.racks || !data.consumptions) {
      throw new Error('Format de fichier invalide')
    }

    return apiClient.importData(data)
  }

  async function importFromFile(file: File): Promise<ImportResult> {
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
    await apiClient.deleteAllData()
  }

  return {
    exportData,
    downloadExport,
    importData,
    importFromFile,
    resetAllData,
  }
}
