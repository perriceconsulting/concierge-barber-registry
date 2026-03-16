import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for Concierge Barber Registry. Learn how we collect, use, and protect your personal information.',
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl min-h-[calc(100vh-16rem)]">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-primary">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: March 16, 2026
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Introduction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Welcome to Concierge Barber Registry (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website conciergebarberregistry.com.
            </p>
            <p>
              Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Personal Information</h3>
              <p>We collect personal information that you voluntarily provide to us when you:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Register for an account</li>
                <li>Create a barber profile</li>
                <li>Submit a contact form</li>
                <li>Leave a review</li>
                <li>Subscribe to our newsletter</li>
              </ul>
              <p className="mt-2">This information may include:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Name and contact information (email, phone number, address)</li>
                <li>Account credentials (username, password)</li>
                <li>Professional information (barber license, certifications)</li>
                <li>Business information (business name, location, hours)</li>
                <li>Portfolio images and descriptions</li>
                <li>Payment information (processed securely through third-party providers)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Automatically Collected Information</h3>
              <p>When you visit our site, we automatically collect certain information, including:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>IP address and browser type</li>
                <li>Device information</li>
                <li>Pages visited and time spent</li>
                <li>Referring website</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-muted-foreground">
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Create and manage your account</li>
              <li>Process your transactions</li>
              <li>Provide customer support</li>
              <li>Send administrative information and updates</li>
              <li>Display your barber profile to potential clients</li>
              <li>Facilitate connections between barbers and clients</li>
              <li>Improve our website and services</li>
              <li>Prevent fraud and enhance security</li>
              <li>Comply with legal obligations</li>
              <li>Send marketing communications (with your consent)</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Sharing Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>We may share your information in the following situations:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Public Profiles:</strong> Information in barber profiles is publicly visible to all visitors</li>
              <li><strong>Service Providers:</strong> Third-party vendors who perform services on our behalf (payment processing, hosting, analytics)</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, sale, or acquisition</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>With Your Consent:</strong> Any other disclosure made with your permission</li>
            </ul>
            <p className="mt-3">
              We do NOT sell your personal information to third parties.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Cookies and Tracking Technologies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              We use cookies and similar tracking technologies to track activity on our website and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our website.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Data Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              We implement appropriate technical and organizational security measures to protect your personal information. However, please note that no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. License Document Handling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              As part of the barber verification process, we collect professional license documents (photos or scans of barber licenses). These documents are handled with the following safeguards:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Purpose:</strong> License documents are collected solely for identity and credential verification to ensure barbers on our platform are licensed professionals.</li>
              <li><strong>Confidentiality:</strong> License documents are never displayed publicly on barber profiles or anywhere on the website. They are only accessible to authorized administrators during the verification process.</li>
              <li><strong>Secure Storage:</strong> Documents are stored securely using encrypted cloud storage with access controls limiting visibility to authorized personnel only.</li>
              <li><strong>Retention:</strong> License documents are retained for the duration of your active account plus 30 days after account deletion, after which they are permanently removed.</li>
              <li><strong>Deletion Requests:</strong> Barbers may request early deletion of their license documents by contacting our support team at privacy@conciergebarberregistry.com. Please note that deleting your license document may affect your verification status.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Your Privacy Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-muted-foreground">
            <p>Depending on your location, you may have the following rights:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Access to your personal information</li>
              <li>Correction of inaccurate data</li>
              <li>Deletion of your information</li>
              <li>Opt-out of marketing communications</li>
              <li>Data portability</li>
              <li>Withdraw consent</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, please contact us at privacy@conciergebarberregistry.com
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. Children&apos;s Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Our website is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>10. Third-Party Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review the privacy policies of any third-party sites you visit.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>11. Changes to This Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the &quot;Last updated&quot; date. You are advised to review this privacy policy periodically for any changes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>12. Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              If you have questions or concerns about this privacy policy, please contact us at:
            </p>
            <div className="ml-4">
              <p>Email: privacy@conciergebarberregistry.com</p>
              <p>Website: conciergebarberregistry.com/contact</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
