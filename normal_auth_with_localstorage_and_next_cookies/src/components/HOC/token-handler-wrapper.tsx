"use client"
import { getTokensAction } from '@/actions/auth/get-tokens-action';
import { logoutServerAction } from '@/actions/auth/logout-server-action';
import { refreshTokenGenerationAction } from '@/actions/auth/refresh-token-generation-action';
import { validateJwtToken } from '@/lib/jwt-token';
import useAuthStore from '@/store/authStore';
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect } from 'react'
interface Props {
  token: string;
  children: React.ReactNode;
  refreshToken: string
}

const TokenHandlerWrapper = ({ token, children, refreshToken }: Props) => {
  const path = usePathname()
  const setToken = useAuthStore(state => state.setToken)
  const logOut = useAuthStore(state => state.clearToken)
  const router = useRouter()
  async function validateAndRefetchToken() {
    const res = await getTokensAction()
    if (!res?.accessToken || !res?.refreshToken) {
      logOut()
      logoutServerAction()
      router.refresh()
    }
    const isTokenValid = await validateJwtToken(res?.accessToken ?? "")
    console.log("isTokenValid", isTokenValid)
    if (!isTokenValid) {
      const res = await refreshTokenGenerationAction()
      if ((!res?.access_token || !res?.refresh_token) || !validateJwtToken(res?.access_token ?? "")) {
        logOut()
        logoutServerAction()
        router.refresh()
      } else {
        setToken(res?.access_token ?? "", res?.refresh_token ?? "")
      }
    }
    return res
  }

  
  useEffect(() => {
      setToken(token,refreshToken)
  }, [token,refreshToken])

  return (
    <div>{children}</div>
  )
}

export default TokenHandlerWrapper