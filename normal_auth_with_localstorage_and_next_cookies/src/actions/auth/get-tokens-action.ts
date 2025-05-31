// actions/auth/get-tokens-action.ts
'use server';

import { authOptions } from "@/auth";
import { getServerSession } from "next-auth"; 

export async function getTokensAction() {
  const session = await getServerSession(authOptions); // Pass authOptions here
  console.log('Full session:', session); // Debug log
  
  return {
    accessToken: session?.accessToken,
    refreshToken: session?.refreshToken
  };
}