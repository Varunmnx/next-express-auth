import { jwtVerify } from "jose"

export async function validateJwtToken(token: string) {
    try {
        if (!token) return false

        // Verify the JWT token
        // Use the same secret as NextAuth
        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "mykey")
        const res = await jwtVerify(token, secretKey)
        return true
    } catch {
        return false
    }
}

// Helper function to decode JWT without verification (for debugging)
export function decodeJwt(token: string) {
    try {
        if (!token) return null
        
        // Split the token and decode the payload
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        )
        
        return JSON.parse(jsonPayload)
    } catch {
        return null
    }
}