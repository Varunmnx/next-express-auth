"use client"
import useAuthStore from '@/store/authStore';
import { usePathname } from 'next/navigation'
import React, { useEffect } from 'react'
interface Props{
    token:string;
    children:React.ReactNode
}

const TokenHandlerWrapper = ({token,children}:Props) => {
   const path = usePathname()
   const setToken = useAuthStore(state=>state.setToken)
   
   useEffect(()=>{
    setToken(token)
   },[token])

  return (
    <div>{children}</div>
  )
}

export default TokenHandlerWrapper