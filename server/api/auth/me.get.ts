export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  return { id: user.id, email: user.email }
})
