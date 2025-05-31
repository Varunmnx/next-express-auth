"use server"
import { CookieKeys } from "@/lib/constants";
import { cookies } from "next/headers";

export async function logoutServerAction(){
    const cookieStorage = await cookies();
    cookieStorage.getAll().forEach(cookie => cookieStorage.delete(cookie.name));
}