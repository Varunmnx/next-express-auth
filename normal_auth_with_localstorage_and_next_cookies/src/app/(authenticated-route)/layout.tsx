import TokenHandlerWrapper from "@/components/HOC/token-handler-wrapper"
import { CookieKeys } from "@/lib/constants"
import { cookies } from "next/headers"


const Layout = async({children}:{children:React.ReactNode}) => {
  const cookieStore = await cookies()
  const token = cookieStore.get(CookieKeys.AUTH_TOKEN)?.value
  const refreshToken = cookieStore.get(CookieKeys.REFRESH_TOKEN)?.value
  return (
    <TokenHandlerWrapper token={token ?? ""} refreshToken={refreshToken ?? ""} >{children}</TokenHandlerWrapper >
  )
}

export default Layout