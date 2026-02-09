import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  return (
    <Card className="max-w-md w-full">
      <CardHeader>
        <CardTitle>Login Page</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600 text-sm">
          Login page will be implemented in Phase 4.
        </p>
        <p className="text-slate-500 text-xs mt-2">
          For testing, auth functionality is handled by the AuthProvider.
        </p>
      </CardContent>
    </Card>
  )
}
