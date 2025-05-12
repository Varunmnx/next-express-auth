"use client" 
import { API } from '@/services' 
import React, { useEffect } from 'react'

const page = () => { 
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
    const res = await Promise.all([getUserDetails(),getUserDetailsB()])
    console.log(res)  
   })()
},[ ])

  return (
    <div>This is a authenticated route </div>
  )
}

export default page