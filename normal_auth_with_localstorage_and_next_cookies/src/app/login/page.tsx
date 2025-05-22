"use client" 
import { useRouter } from 'next/navigation'
import { signIn } from "next-auth/react";
import React, { useState } from 'react'

const USERNAME = "admin"
const PASSWORD = "password123"    
const Page = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    await signIn("credentials", {
      username,
      password,
      callbackUrl: "/",
    });
  }
  
  return (
    <div className="login-container">
      <h1>Login</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input 
            type="text" 
            id="username" 
            name="username" 
            defaultValue={USERNAME} 
            placeholder="Enter username" 
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            defaultValue={PASSWORD} 
            placeholder="Enter password" 
          />
        </div>
        <button type="submit" className="submit-button">Login</button>
      </form>
    </div>
  )
}

export default Page