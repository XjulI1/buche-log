import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import * as syncService from '../services/sync.service.js'
import type { SyncRequest, SyncResponse } from '../types/index.js'

export async function sync(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!
    const syncRequest: SyncRequest = req.body
    const serverTimestamp = new Date()

    // Process incoming racks
    const rackResults = await syncService.processRacks(userId, syncRequest.racks || [])

    // Process incoming consumptions
    const consumptionResults = await syncService.processConsumptions(
      userId,
      syncRequest.consumptions || [],
    )

    // Get changes from server since last sync
    const serverChanges = await syncService.getServerChanges(userId, syncRequest.lastSyncTimestamp)
    // Update sync metadata
    await syncService.updateSyncMetadata(userId, serverTimestamp)

    const response: SyncResponse = {
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

    res.json(response)
  } catch (error) {
    next(error)
  }
}

export async function getStatus(req: AuthRequest, res: Response): Promise<void> {
  res.json({
    userId: req.userId,
    serverTime: new Date().toISOString(),
  })
}
