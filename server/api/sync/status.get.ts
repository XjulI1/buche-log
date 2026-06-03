export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  return {
    userId: user.id,
    serverTime: new Date().toISOString(),
  }
})
