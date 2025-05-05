import TokenHandlerWrapper from "@/components/HOC/token-handler-wrapper"
import { CookieKeys } from "@/lib/constants"
import { cookies } from "next/headers"


const Layout = async({children}:{children:React.ReactNode}) => {
  const cookieStore = await cookies()
  const token = cookieStore.get(CookieKeys.AUTH_TOKEN)?.value
  return (
    <TokenHandlerWrapper token={token ?? ""} >{children}</TokenHandlerWrapper >
  )
}

export default Layout