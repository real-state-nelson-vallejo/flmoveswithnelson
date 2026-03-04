import { useTranslations } from "next-intl";

export default function PrivacyPolicy() {
    return (
        <main className="min-h-screen bg-background pt-32 pb-16">
            <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold mb-8 text-foreground">Privacy Policy</h1>
                <div className="prose prose-lg dark:prose-invert max-w-none space-y-6 text-muted-foreground">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. Introduction</h2>
                        <p>
                            Welcome to <strong>Nelson Vallejo Real Estate</strong> ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. The Data We Collect</h2>
                        <p>Information you provide to us directly:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li><strong>Identity Data:</strong> First name, last name, username or similar identifier.</li>
                            <li><strong>Contact Data:</strong> Billing address, delivery address, email address, and telephone numbers.</li>
                            <li><strong>Financial Data:</strong> Information necessary to facilitate real estate transactions.</li>
                            <li><strong>Property Preferences:</strong> Information regarding the criteria of properties you are interested in buying, selling, or renting.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. How We Use Your Data</h2>
                        <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>To provide real estate brokerage services to you.</li>
                            <li>To manage our relationship with you, including notifying you about changes to our terms or privacy policy.</li>
                            <li>To administer and protect our business and this website.</li>
                            <li>To provide you with information about properties or services that you request from us.</li>
                            <li>To use data analytics to improve our website, products/services, marketing, customer relationships and experiences.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. SMS and Communications</h2>
                        <p>
                            By providing your phone number, you agree to receive SMS alerts regarding our real estate services and property updates. Message and data rates may apply. You can reply STOP to opt-out at any time. We do not sell or share SMS opt-in consent and phone numbers with third parties for their own marketing purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Data Security</h2>
                        <p>
                            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">6. Your Legal Rights</h2>
                        <p>
                            Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data, and (where the lawful ground of processing is consent) to withdraw consent.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">7. Contact Us</h2>
                        <p>If you have any questions about this privacy policy or our privacy practices, please contact us at:</p>
                        <ul className="list-none mt-2 space-y-1">
                            <li><strong>Nelson Vallejo Real Estate</strong></li>
                            <li>Polk County, FL</li>
                            <li>Vallejonelson1722@gmail.com</li>
                            <li>(352) 243-5370</li>
                        </ul>
                    </section>
                </div>
            </div>
        </main>
    );
}
