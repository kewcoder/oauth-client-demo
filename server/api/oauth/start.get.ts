import { buildAuthorizeUrl } from '../../utils/oauth'

export default defineEventHandler((event) => {
  const { url } = buildAuthorizeUrl(event)
  return sendRedirect(event, url)
})
