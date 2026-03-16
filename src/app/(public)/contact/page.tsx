'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { secureFetch } from '@/lib/csrf-client';

export default function ContactPage() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await secureFetch('/api/support', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast({
          title: 'Message Sent',
          description: 'Thank you for contacting us! We\'ll get back to you soon.',
          variant: 'success',
        });
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        const data = await response.json();
        const details = data.error?.details;
        const fieldErrors = Array.isArray(details)
          ? details.map((d: { field: string; message: string }) => `${d.field}: ${d.message}`).join('. ')
          : null;
        showToast({
          title: 'Error',
          description: fieldErrors || data.error?.message || 'Failed to send message. Please try again.',
          variant: 'error',
        });
      }
    } catch (_error) {
      showToast({
        title: 'Error',
        description: 'An error occurred. Please try again later.',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl min-h-[calc(100vh-16rem)]">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-primary">Contact Us</h1>
          <p className="text-lg text-muted-foreground">
            Have a question or feedback? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Get in Touch</CardTitle>
              <CardDescription>
                We&apos;re here to help with any questions or concerns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Business Hours</h3>
                  <p className="text-muted-foreground">
                    Monday - Friday: 9:00 AM - 6:00 PM EST<br />
                    Saturday - Sunday: Closed
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Response Time</h3>
                  <p className="text-muted-foreground">
                    We typically respond within 24-48 hours
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3">Follow Us</h3>
                <div className="flex gap-3">
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Instagram
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Twitter
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Facebook
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send a Message</CardTitle>
              <CardDescription>
                Fill out the form and we&apos;ll get back to you soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="your.email@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    placeholder="What's this about?"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    placeholder="Your message..."
                    rows={5}
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">How do I register as a barber?</h3>
              <p className="text-muted-foreground text-sm">
                Click the &quot;Register as Barber&quot; link in the navigation menu and complete the registration form. Your profile will be reviewed by our team within 24-48 hours.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">How can I update my barber profile?</h3>
              <p className="text-muted-foreground text-sm">
                Log in to your account and navigate to the Dashboard. From there, you can update your profile, services, portfolio, and operating hours.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">How do I report an issue with a barber profile?</h3>
              <p className="text-muted-foreground text-sm">
                Please contact us using the form above with details about the issue. Include the barber&apos;s name or profile URL if possible.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Can I delete my account?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, you can deactivate or delete your account from the Settings page in your dashboard. Contact us if you need assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
