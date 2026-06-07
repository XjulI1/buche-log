import type { SyncRequest, SyncResponse } from '#shared/types'
import {
  getServerChanges,
  processConsumptions,
  processRacks,
  updateSyncMetadata,
} from '../../utils/sync'

export default defineEventHandler(async (event): Promise<SyncResponse> => {
  const user = await requireAuth(event)
  const body = await readBody<SyncRequest>(event)
  const serverTimestamp = new Date()

  const rackResults = await processRacks(user.id, body.racks || [])
  const consumptionResults = await processConsumptions(user.id, body.consumptions || [])

  const serverChanges = await getServerChanges(user.id, body.lastSyncTimestamp)
  await updateSyncMetadata(user.id, serverTimestamp)

  return {
    serverTimestamp: serverTimestamp.toISOString(),
    racks: {
      created: [...rackResults.created, ...serverChanges.racks.created],
      updated: [...rackResults.updated, ...serverChanges.racks.updated],
      deleted: [...rackResults.deleted, ...serverChanges.racks.deleted],
    },
    consumptions: {
      created: [...consumptionResults.created, ...serverChanges.consumptions.created],
      updated: [...consumptionResults.updated, ...serverChanges.consumptions.updated],
      deleted: [...consumptionResults.deleted, ...serverChanges.consumptions.deleted],
    },
    conflicts: [...rackResults.conflicts, ...consumptionResults.conflicts],
  }
})
