"use client" 
import { getTokensAction } from '@/actions/auth/get-tokens-action'
import { API } from '@/services' 
import { useSession } from 'next-auth/react'
import React, { useEffect } from 'react'

const page = () => { 
  const session = useSession()
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
async function getUserDetailsB(){
  try {
    const res = await API.get({
        slug:"/meTest"
     })
    console.log(res)
    return res
  } catch (error) {
    console.log(error)
    console.log("======> line 13 from [about-me] <======")
  }
 
}

useEffect(()=>{ 
  (async()=>{
    // const res = await Promise.all([getUserDetails(),getUserDetailsB()])
    // console.log(res)  
    const res = await getTokensAction()
    console.log("be session",res)
  })()
  console.log("Session",session)
},[ session])

  return (
    <div>This is a authenticated route </div>
  )
}

export default page