'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/config';

interface FaqItem {
  question: string;
  answer: string;
}

const gettingStarted: FaqItem[] = [
  {
    question: 'How do I set up my barber profile?',
    answer:
      'Go to the Profile page from the sidebar. Fill in your display name, bio, specialties, location, and contact details. Your profile becomes visible to clients once you save it.',
  },
  {
    question: 'How do I add services?',
    answer:
      'Navigate to Services in the sidebar. Click "Add Service" and enter the service name, description, price, and duration. Clients will see these on your public profile.',
  },
  {
    question: 'How do I upload portfolio images?',
    answer:
      'Go to Portfolio in the sidebar. Click "Upload" to add photos of your work. High-quality images of your best cuts help attract new clients. The number of images you can upload depends on your subscription tier.',
  },
  {
    question: 'How do clients find me?',
    answer:
      'Clients can search for barbers by location, name, or specialty on the Find Barbers page. Having a complete profile with photos, services, and good reviews helps you rank higher in search results.',
  },
];

const managingBusiness: FaqItem[] = [
  {
    question: 'How do contact requests work?',
    answer:
      'When a client clicks "Contact" on your public profile, they fill out a form with their details and message. The request is saved and appears in your Requests page. You can mark requests as read, responded, or archived. You can also reply directly via email using the "Reply via Email" button.',
  },
  {
    question: 'How do reviews work?',
    answer:
      'Clients can leave reviews on your public profile after visiting you. You can view all your reviews in the Reviews section. With a Professional or Elite subscription, you can respond to reviews directly.',
  },
  {
    question: 'How do I respond to reviews?',
    answer:
      'Review responses are available on the Professional plan and above. Go to Reviews in the sidebar, find the review you want to respond to, and click "Reply". Your response will appear publicly below the review on your profile.',
  },
  {
    question: 'Where can I see my dashboard stats?',
    answer:
      'Your Dashboard shows real-time stats including total reviews, average rating, new contact requests needing response, and total requests. It also shows your 5 most recent contact requests and reviews.',
  },
];

const subscriptionFaq: FaqItem[] = [
  {
    question: 'What are the subscription tiers?',
    answer:
      'We offer three tiers: Starter (free), Professional ($29/mo), and Elite ($59/mo). Each tier unlocks more portfolio images, services, contact requests, and premium features like review responses and SEO optimization.',
  },
  {
    question: 'How do I upgrade my plan?',
    answer:
      'Go to the Subscription page from the sidebar. You\'ll see your current plan and usage. Click "Start Free Trial" on the plan you want to try. All paid plans include a 14-day free trial.',
  },
  {
    question: 'How do I manage my billing?',
    answer:
      'On the Subscription page, click "Manage Billing" to access the Stripe billing portal. From there, you can update your payment method, view invoices, or cancel your subscription.',
  },
  {
    question: 'What happens if I downgrade?',
    answer:
      'Your content is never deleted when you downgrade. Items beyond your new tier\'s limits will be hidden from your public profile but remain in your dashboard. Upgrading again will restore full visibility.',
  },
];

const verificationFaq: FaqItem[] = [
  {
    question: 'How does license verification work?',
    answer:
      'After registering, upload a clear photo or scan of your professional barber license on your Profile page. Our admin team reviews it within 24-48 hours. Once approved, your profile becomes visible to clients with a "Verified" badge.',
  },
  {
    question: 'What happens if my account is suspended?',
    answer:
      'If your account is suspended, your profile is hidden from clients and your Stripe subscription is automatically cancelled with a prorated refund. You\'ll see a banner on your Dashboard with a link to the Appeal page, which explains the reason and your options.',
  },
  {
    question: 'How do I appeal a suspension?',
    answer:
      'Go to the Appeal page from your Dashboard sidebar (it appears when your account is suspended). You\'ll see the suspension reason and guided steps to resolve it. For example, if your license expired, you can upload a renewed license directly on the appeal page. Then submit your appeal — our team reviews it within 5 business days.',
  },
  {
    question: 'Can all suspensions be appealed?',
    answer:
      'No. Suspensions for expired licenses, policy violations, and client complaints are appealable. Suspensions for fraudulent documentation, payment fraud, or legal/regulatory reasons are not eligible for appeal. The Appeal page will clearly indicate whether your suspension is appealable.',
  },
  {
    question: 'What happens when my appeal is approved?',
    answer:
      'Your account is reinstated, your profile becomes visible again, and you\'ll receive an email confirmation. You can then resubscribe from the Subscription page.',
  },
];

const accountFaq: FaqItem[] = [
  {
    question: 'How do I change my password?',
    answer:
      'Go to Settings in the sidebar. You can update your password in the security section. You\'ll need to enter your current password to set a new one.',
  },
  {
    question: 'How do I update my email notifications?',
    answer:
      'Go to Settings in the sidebar. You can toggle notifications for contact requests, new reviews, and marketing emails.',
  },
  {
    question: 'I forgot my password. How do I reset it?',
    answer:
      'On the login page, click "Forgot password?" and enter your email address. You\'ll receive a password reset link. If you don\'t see the email, check your spam folder.',
  },
  {
    question: 'I\'m not receiving the verification email.',
    answer:
      'Check your spam or junk folder. Make sure you entered the correct email address during registration. If you still don\'t see it, try registering again or contact support.',
  },
];

function FaqSection({ title, items }: { title: string; items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="border rounded-md">
            <button
              className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <span className="text-sm font-medium pr-4">{item.question}</span>
              <span className="text-muted-foreground shrink-0">
                {openIndex === index ? '−' : '+'}
              </span>
            </button>
            {openIndex === index && (
              <div className="px-4 pb-3 text-sm text-muted-foreground border-t pt-3">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Help Center</h1>
        <p className="text-muted-foreground mt-2">
          Find answers to common questions about managing your barber profile
        </p>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Jump to the section you need</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <Link
              href={ROUTES.DASHBOARD_PROFILE}
              className="p-3 rounded-md border hover:bg-muted/50 transition-colors text-center"
            >
              <span className="text-2xl block mb-1">👤</span>
              <span className="text-sm font-medium">Edit Profile</span>
            </Link>
            <Link
              href={ROUTES.DASHBOARD_SERVICES}
              className="p-3 rounded-md border hover:bg-muted/50 transition-colors text-center"
            >
              <span className="text-2xl block mb-1">✂️</span>
              <span className="text-sm font-medium">Manage Services</span>
            </Link>
            <Link
              href={ROUTES.DASHBOARD_PORTFOLIO}
              className="p-3 rounded-md border hover:bg-muted/50 transition-colors text-center"
            >
              <span className="text-2xl block mb-1">📸</span>
              <span className="text-sm font-medium">Upload Photos</span>
            </Link>
            <Link
              href={ROUTES.DASHBOARD_SUBSCRIPTION}
              className="p-3 rounded-md border hover:bg-muted/50 transition-colors text-center"
            >
              <span className="text-2xl block mb-1">💳</span>
              <span className="text-sm font-medium">Subscription</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      <FaqSection title="Getting Started" items={gettingStarted} />
      <FaqSection title="Managing Your Business" items={managingBusiness} />
      <FaqSection title="Verification & Appeals" items={verificationFaq} />
      <FaqSection title="Subscription & Billing" items={subscriptionFaq} />
      <FaqSection title="Account & Login" items={accountFaq} />

      {/* Still need help */}
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-lg font-medium mb-2">Still need help?</p>
          <p className="text-sm text-muted-foreground mb-4">
            Check our public FAQ or get in touch with our support team.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href={ROUTES.FAQ}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4"
            >
              Public FAQ
            </Link>
            <Link
              href={ROUTES.CONTACT}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4"
            >
              Contact Support
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
