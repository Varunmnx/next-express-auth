'use server'

import { CookieKeys } from "@/lib/constants"
import { cookies } from "next/headers"

export async function getTokensAction(){
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(CookieKeys.AUTH_TOKEN)?.value
    const refreshToken = cookieStore.get(CookieKeys.REFRESH_TOKEN)?.value

    return { accessToken, refreshToken }

}