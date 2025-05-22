"use server"
import { logoutServerAction } from "./logout-server-action";
import { getTokensAction } from "./get-tokens-action";

export async function refreshTokenGenerationAction() {
    try {
        const { accessToken, refreshToken } = await getTokensAction()
        
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