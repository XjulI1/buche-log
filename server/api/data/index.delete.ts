import { softDeleteUserData } from '../../utils/userData'

/** Suppression de toutes les donnees de l'utilisateur (le compte est conserve) */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  await useDb().transaction((tx) => softDeleteUserData(tx, user.id, new Date()))

  setResponseStatus(event, 204)
  return null
})
