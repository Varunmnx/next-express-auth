'use server'
import { getServerSession } from "next-auth"

export async function getTokensAction(){
    const session = await getServerSession() 
    const accessToken = session?.accessToken
    const refreshToken = session?.refreshToken
    console.log('session', session) 
    return { accessToken, refreshToken }

}