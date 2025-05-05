"use client"
import { login } from '@/actions/auth/login-server-action'
import { redirect } from 'next/navigation'
import React from 'react'

const USERNAME = "admin"
const PASSWORD = "password123"    
const page = () => {
  const onSubmit = async (e:React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    const { username , password} = e.currentTarget as HTMLFormElement
    const response = await login(username?.value,password?.value)
    if(response?.success){
        redirect('/home')
    }
  }
  return (
    <form onSubmit={onSubmit}>
        <input type="text" name='username' value={USERNAME} placeholder='enter usernname' />
        <input type="text" name='password' value={PASSWORD} placeholder='enter usernname' />
        <button type='submit'>Submit</button>
    </form>
  )
}

export default page