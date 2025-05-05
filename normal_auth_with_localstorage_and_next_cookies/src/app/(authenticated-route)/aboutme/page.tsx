"use client"
import { API } from '@/services'
import useAuthStore from '@/store/authStore'
import React, { useEffect } from 'react'

const page = () => {
const token = useAuthStore(state=>state.auth.token)
async function getUserDetails(){
  try {
    const res = await API.get({
        slug:"/me"
     })
    console.log(res)
    return res
  } catch (error) {
    console.log(error)
    console.log("======> line 13 from [about-me] <======")
  }
 
}


useEffect(()=>{
    getUserDetails()
},[token])
  return (
    <div>This is a authenticated route {token}</div>
  )
}

export default page