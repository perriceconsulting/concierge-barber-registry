import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl min-h-[calc(100vh-16rem)]">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-primary">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: March 13, 2026
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Agreement to Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              By accessing or using Concierge Barber Registry ("the Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Platform.
            </p>
            <p>
              We reserve the right to modify these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the modified Terms.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Eligibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              You must be at least 18 years old to use the Platform. By using the Platform, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these Terms.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. User Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>To access certain features, you must create an account. You agree to:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information as necessary</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent or harmful activities.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Barber Verification and Profiles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Barbers who register on the Platform must:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Hold a valid barber license in their jurisdiction</li>
              <li>Provide accurate business information</li>
              <li>Upload only authentic portfolio images of their own work</li>
              <li>Maintain current and accurate service pricing</li>
              <li>Respond to client inquiries in a timely manner</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
            <p className="mt-3">
              We reserve the right to verify credentials and reject or remove profiles that do not meet our standards.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Client Responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>Clients using the Platform agree to:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Provide honest and accurate reviews</li>
              <li>Respect barber availability and policies</li>
              <li>Not submit false or misleading information</li>
              <li>Not harass, threaten, or abuse barbers or other users</li>
              <li>Honor appointments or provide reasonable cancellation notice</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Reviews and User-Generated Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              By submitting reviews or other content to the Platform, you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, modify, and display such content.
            </p>
            <p>You agree that your content will:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Be truthful and based on your actual experience</li>
              <li>Not contain offensive, defamatory, or inappropriate language</li>
              <li>Not violate any third-party rights</li>
              <li>Not contain spam or promotional content</li>
            </ul>
            <p className="mt-3">
              We reserve the right to remove any content that violates these Terms or our community guidelines.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Prohibited Activities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>You may not:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Use the Platform for any illegal purpose</li>
              <li>Impersonate any person or entity</li>
              <li>Upload viruses or malicious code</li>
              <li>Attempt to gain unauthorized access to the Platform</li>
              <li>Scrape or harvest data from the Platform</li>
              <li>Interfere with the proper functioning of the Platform</li>
              <li>Create multiple accounts to manipulate ratings</li>
              <li>Submit false reviews or ratings</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Subscription and Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Barber profiles require a paid subscription. By subscribing, you agree to:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Pay all fees associated with your subscription</li>
              <li>Provide valid payment information</li>
              <li>Authorize recurring charges (for subscription plans)</li>
            </ul>
            <p className="mt-3">
              Subscription fees are non-refundable except as required by law. You may cancel your subscription at any time, effective at the end of the current billing period.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              All content on the Platform, including text, graphics, logos, images, and software, is the property of Concierge Barber Registry or its licensors and is protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p>
              You may not reproduce, distribute, modify, or create derivative works from any content without our express written permission.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>10. Platform Relationship</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Concierge Barber Registry is a platform that connects barbers and clients. We are not a party to any agreements between barbers and clients and are not responsible for:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>The quality of services provided by barbers</li>
              <li>Disputes between barbers and clients</li>
              <li>Appointment cancellations or no-shows</li>
              <li>The accuracy of barber-provided information</li>
              <li>Any injuries, damages, or losses arising from barber services</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>11. Disclaimers and Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>12. Indemnification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              You agree to indemnify and hold harmless Concierge Barber Registry, its affiliates, and their respective officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses arising from your use of the Platform or violation of these Terms.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>13. Termination</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              We may terminate or suspend your account and access to the Platform at any time, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
            </p>
            <p>
              Upon termination, your right to use the Platform will immediately cease. All provisions of these Terms that by their nature should survive termination shall survive.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>14. Governing Law</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>15. Dispute Resolution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Any disputes arising from these Terms or your use of the Platform shall be resolved through binding arbitration, except where prohibited by law. You waive any right to participate in a class action lawsuit or class-wide arbitration.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>16. Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              If you have questions about these Terms, please contact us at:
            </p>
            <div className="ml-4">
              <p>Email: legal@conciergebarberregistry.online</p>
              <p>Website: conciergebarberregistry.online/contact</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
