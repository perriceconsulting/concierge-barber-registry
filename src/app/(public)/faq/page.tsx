'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface FAQItem {
  id: number;
  category: string;
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    id: 1,
    category: 'General',
    question: 'What is Concierge Barber Registry?',
    answer: 'Concierge Barber Registry is a platform that connects clients with verified, top-rated barbers. We help you discover skilled barbers in your area, view their portfolios, read reviews, and book appointments.',
  },
  {
    id: 2,
    category: 'General',
    question: 'Is the service free to use?',
    answer: 'Yes! Browsing barber profiles, viewing portfolios, and reading reviews is completely free for clients. Barbers pay a subscription fee to maintain their profiles on our platform.',
  },
  {
    id: 3,
    category: 'For Clients',
    question: 'How do I find a barber near me?',
    answer: 'Use our search feature to filter barbers by location, specialty, rating, and availability. You can view their profiles, portfolios, and reviews to make an informed decision.',
  },
  {
    id: 4,
    category: 'For Clients',
    question: 'How do I book an appointment?',
    answer: 'Click the "Contact Barber" button on their profile page and fill out the contact form with your preferred date and time. The barber will respond to your request directly.',
  },
  {
    id: 5,
    category: 'For Clients',
    question: 'Can I leave a review?',
    answer: 'Yes! After visiting a barber, you can leave a review and rating. Your honest feedback helps other clients make informed decisions and helps barbers improve their services.',
  },
  {
    id: 6,
    category: 'For Clients',
    question: 'Are all barbers verified?',
    answer: 'Yes, all barbers on our platform go through a verification process where we check their credentials, license information, and professional background before approval.',
  },
  {
    id: 7,
    category: 'For Barbers',
    question: 'How do I register as a barber?',
    answer: 'Click "Register as Barber" in the navigation menu and complete the registration form. Include your license information, business details, and any relevant certifications. Our team will review your application within 24-48 hours.',
  },
  {
    id: 8,
    category: 'For Barbers',
    question: 'What information should I include in my profile?',
    answer: 'Include high-quality photos of your work, detailed service descriptions with pricing, your specialties, and your business location. A complete profile attracts more clients.',
  },
  {
    id: 9,
    category: 'For Barbers',
    question: 'How do I manage my portfolio?',
    answer: 'Log in to your dashboard and navigate to the Portfolio section. You can upload up to 20 high-quality images of your work, add captions, and reorder them to showcase your best cuts.',
  },
  {
    id: 10,
    category: 'For Barbers',
    question: 'How do I respond to client requests?',
    answer: 'All client contact requests appear in the Requests section of your dashboard. You can view details, respond directly, and manage your appointment schedule.',
  },
  {
    id: 11,
    category: 'For Barbers',
    question: 'What are the subscription costs?',
    answer: 'We offer three tiers: Starter (free), Professional ($29/mo), and Elite ($59/mo). Each tier unlocks more portfolio images, services, contact requests, and premium features like review responses. All paid plans include a 14-day free trial.',
  },
  {
    id: 12,
    category: 'For Barbers',
    question: 'Can I update my services and pricing?',
    answer: 'Absolutely! Log in to your dashboard and go to the Services section. You can add, edit, or remove services and update pricing at any time. Clients will see your updated services and prices on your public profile.',
  },
  {
    id: 19,
    category: 'For Barbers',
    question: 'What happens if my account is suspended?',
    answer: 'If your account is suspended, your profile is hidden from clients. You\'ll see a banner on your dashboard with the reason and a link to the Appeal page. Depending on the reason, you may be able to submit an appeal with guided steps to resolve the issue (e.g., uploading a renewed license).',
  },
  {
    id: 20,
    category: 'For Barbers',
    question: 'How do I appeal a suspension?',
    answer: 'Go to the Appeal page from your dashboard sidebar. It will show the reason for your suspension, whether you\'re eligible to appeal, and specific steps to resolve it. For appealable suspensions, you can submit an appeal that our team reviews within 5 business days.',
  },
  {
    id: 13,
    category: 'Account & Security',
    question: 'How do I reset my password?',
    answer: 'Click "Forgot Password" on the login page, enter your email address, and we\'ll send you a password reset link. Follow the instructions in the email to create a new password.',
  },
  {
    id: 14,
    category: 'Account & Security',
    question: 'Is my personal information secure?',
    answer: 'Yes, we take security seriously. All data is encrypted, and we follow industry best practices to protect your personal information. We never share your data with third parties without your consent.',
  },
  {
    id: 15,
    category: 'Account & Security',
    question: 'Can I delete my account?',
    answer: 'Yes, you can deactivate or permanently delete your account from the Settings page in your dashboard. For barbers, please cancel your subscription before deleting your account.',
  },
  {
    id: 16,
    category: 'Technical',
    question: 'What browsers are supported?',
    answer: 'Our platform works best on the latest versions of Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated for the best experience.',
  },
  {
    id: 17,
    category: 'Technical',
    question: 'Is there a mobile app?',
    answer: 'Currently, we don\'t have a dedicated mobile app, but our website is fully responsive and works great on mobile devices. A mobile app is planned for future development.',
  },
  {
    id: 18,
    category: 'Technical',
    question: 'I\'m experiencing technical issues. What should I do?',
    answer: 'Try clearing your browser cache and cookies first. If the issue persists, contact our support team through the Contact page with details about the problem.',
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(faqs.map(faq => faq.category)))];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl min-h-[calc(100vh-16rem)]">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-primary">Frequently Asked Questions</h1>
          <p className="text-lg text-muted-foreground">
            Find answers to common questions about our platform
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto">
          <Input
            type="search"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap justify-center">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-4 mt-8">
          {filteredFAQs.map((faq) => (
            <Card key={faq.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                    <CardDescription className="mt-1">
                      <span className="inline-block px-2 py-0.5 bg-muted rounded text-xs">
                        {faq.category}
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}

          {filteredFAQs.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No questions found matching your search.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Still Have Questions */}
        <Card className="mt-8 bg-primary/5">
          <CardHeader>
            <CardTitle>Still Have Questions?</CardTitle>
            <CardDescription>
              Can&apos;t find the answer you&apos;re looking for? We&apos;re here to help.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="/contact"
              className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
            >
              Contact Support
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
