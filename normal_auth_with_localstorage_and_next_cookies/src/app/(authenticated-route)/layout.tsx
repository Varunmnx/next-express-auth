"use client"
import { signOut } from 'next-auth/react'

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <> 
        <button onClick={() => signOut({callbackUrl:"/login"})}>Signout</button>
      {children}
    </>
  )
}

export default Layout