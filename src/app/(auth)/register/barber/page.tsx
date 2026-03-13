import { Container } from '@/components/layout/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BarberRegistrationPage() {
  return (
    <Container className="min-h-[calc(100vh-16rem)] py-12">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Register as a Barber</CardTitle>
          <CardDescription>
            Join the Concierge Barber Registry and showcase your skills to clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-4">Multi-Step Registration Flow</h3>
              <p className="text-muted-foreground">
                This is a placeholder for the barber registration flow.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Steps to complete:
              </p>
              <ol className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>1. Account info (name, email, password)</li>
                <li>2. Professional info (bio, experience, license, specialties)</li>
                <li>3. Location & availability (shop address or mobile, hours)</li>
                <li>4. Services & pricing</li>
                <li>5. Portfolio upload (photos of work)</li>
                <li>6. Review & submit for verification</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
