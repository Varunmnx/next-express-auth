import { jwtVerify } from "jose"

export async function validateJwtToken(token: string) {
    try {
        if (!token) return false

        // Verify the JWT token
        // Replace 'your-secret-key' with your actual JWT secret key (preferably from env variables)
        const secretKey = new TextEncoder().encode("mykey")
        const res = await jwtVerify(token, secretKey)
        console.log("decoded token", res)
        return true
    } catch {
        return false
    }

}