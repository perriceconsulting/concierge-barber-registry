'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FAQS } from '@/data/faq';

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(FAQS.map((faq) => faq.category)))];

  const filteredFAQs = FAQS.filter((faq) => {
    const matchesSearch =
      searchQuery === '' ||
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
