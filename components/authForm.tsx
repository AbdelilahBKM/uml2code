'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { login } from '@/store/authReducer'
import { useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [comfirmPassword, setComfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const dispatch = useDispatch();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setErrorMessage("")
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const data = {
      email,
      password,
      ...(isLogin ? {} : { comfirmPassword, username })
    }
    try {

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      const results = await response.json()
      if (!response.ok) {
        setErrorMessage(results.message || "An Error occured");
      } else {
        console.log("success", results);
        dispatch(login({ access: results.token }));
        router.back();
      }


    } catch (error) {
      setErrorMessage('An error occurred. Please try again.')
    } finally {
      setIsLoading(false);
    }

    console.log('Form submitted')
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isLogin ? 'Login' : 'Register'}</CardTitle>
        <CardDescription>
          {isLogin
            ? 'Enter your credentials to access your account'
            : 'Create an account to get started'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} id="username" type="text" required />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} id="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} id="password" type="password" required />
          </div>
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input value={comfirmPassword} onChange={(e) => setComfirmPassword(e.target.value)} id="confirmPassword" type="password" required />
            </div>
          )}
          <Button type="submit" disabled={isLoading} className="w-full">
            {!isLoading ? (isLogin ? 'Login' : 'Register') : 'loading ...'}
          </Button>
          {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}
        </form>
      </CardContent>
      <CardFooter>
        <Button
          disabled={isLoading}
          variant="link"
          className="w-full"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin
            ? "Don't have an account? Register"
            : "Already have an account? Login"
          }
        </Button>
      </CardFooter>
    </Card>
  )
}