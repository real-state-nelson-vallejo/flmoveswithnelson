"use client";

import { use } from 'react';
import { Hero } from '@/components/homesections/Hero';
import { GuidanceSection } from '@/components/homesections/GuidanceSection';
import { AboutSection } from '@/components/homesections/AboutSection';
import { TestimonialsSection } from '@/components/homesections/TestimonialsSection';
import { FAQSection } from '@/components/homesections/FAQSection';
import { DifferenceSection } from '@/components/homesections/DifferenceSection';
import { PropertiesSection } from '@/components/homesections/PropertiesSection';

import { ContactSection } from '@/components/homesections/ContactSection';

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);

    return (
        <main>
            <Hero />
            <GuidanceSection />
            <PropertiesSection locale={locale} />
            <ContactSection />
            <DifferenceSection />
            <AboutSection />
            <TestimonialsSection />
            <FAQSection />
            <ContactSection />
        </main>
    );
}
