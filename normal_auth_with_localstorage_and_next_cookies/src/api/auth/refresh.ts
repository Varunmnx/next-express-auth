// pages/api/auth/refresh.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

/**
 * API endpoint to manually refresh the access token
 * Can be called from the client side when needed
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  // Only allow POST method
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  
  try {
    // Get current session
    const session = await getServerSession(req, res, authOptions);
    
    // If no session or no refresh token
    if (!session || !session.refreshToken) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    
    // Call your backend API to refresh the token
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken: session.refreshToken,
      }),
    });
    
    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }
    
    const data: RefreshTokenResponse = await response.json();
    
    // Return the new tokens
    res.status(200).json({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || session.refreshToken,
      expiresIn: data.expiresIn || 900, // 15 minutes in seconds
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({ error: "Failed to refresh token" });
  }
}