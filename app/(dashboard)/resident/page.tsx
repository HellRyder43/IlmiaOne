import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ResidentDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Welcome to Your Dashboard
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Maintenance Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 text-sm">
              View your billing information and payment history.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visitor Pass</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 text-sm">
              Generate QR codes for your visitors.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Community Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 text-sm">
              Stay updated with community events.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
