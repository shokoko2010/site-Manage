import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldX, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldX className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this resource.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>This could be because:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>You need a higher subscription plan</li>
              <li>You require administrator privileges</li>
              <li>Your account has been restricted</li>
            </ul>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/appboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Appboard
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/settings">
                View Account Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}