"use server"
import { CookieKeys } from "@/lib/constants";
import { cookies } from "next/headers";

export async function logoutServerAction(){
    const cookieStorage = await cookies();
    cookieStorage.delete(CookieKeys.AUTH_TOKEN);
}