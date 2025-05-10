"use server"
import { CookieKeys } from "@/lib/constants";
import { cookies } from "next/headers";
import { logoutServerAction } from "./logout-server-action";

export async function refreshTokenGenerationAction() {
    try {
        const cookieStorage = await cookies()
        const refreshToken = cookieStorage.get(CookieKeys.REFRESH_TOKEN)?.value
        const accessToken = cookieStorage.get(CookieKeys.AUTH_TOKEN)?.value
        
        // Don't attempt refresh if no refresh token exists
        if (!refreshToken) {
            return {
                success: false,
                message: "No refresh token available"
            }
        }
        
        const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "authorization": `Bearer ${accessToken}`
            },
            credentials: 'include',
            body: JSON.stringify({
                refreshToken,
                accessToken
            })
        })
        
        // Handle non-successful response
        if (!response.ok) {
            // Clear cookies on refresh failure 
            logoutServerAction()
            return {
                success: false,
                message: `Failed to refresh token: ${response.status} ${response.statusText}`
            }
        }
        
        const data = await response.json()
        
        // Verify we got the expected data
        if (!data.access_token || !data.refresh_token) {
            return {
                success: false,
                message: "Invalid response from refresh endpoint"
            }
        }
        
        const { access_token, refresh_token } = data
        
        // update tokens in cookies
        cookieStorage.set({
            name: CookieKeys.AUTH_TOKEN,
            value: access_token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure in production
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });
                
        // Set the refresh token cookie
        cookieStorage.set({
            name: CookieKeys.REFRESH_TOKEN,
            value: refresh_token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure in production
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        })
        
        return {
            success: true,
            message: "Refresh token generated successfully",
            access_token,
            refresh_token
        }
    } catch (error) {
        console.error("Refresh token error:", error);
        
        // Clear cookies on error
        logoutServerAction()
        
        return {
            success: false,
            message: "Failed to generate refresh token",
            error: error instanceof Error ? error.message : String(error)
        }
    }
}