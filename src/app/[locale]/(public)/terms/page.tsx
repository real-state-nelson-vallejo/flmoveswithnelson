import { useTranslations } from "next-intl";

export default function TermsOfService() {
    return (
        <main className="min-h-screen bg-background pt-32 pb-16">
            <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold mb-8 text-foreground">Terms of Service</h1>
                <div className="prose prose-lg dark:prose-invert max-w-none space-y-6 text-muted-foreground">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. Agreement to Terms</h2>
                        <p>
                            These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and <strong>Nelson Vallejo Real Estate</strong> ("we," "us" or "our"), concerning your access to and use of our website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the "Site").
                        </p>
                        <p>
                            You agree that by accessing the Site, you have read, understood, and agree to be bound by all of these Terms of Service. If you do not agree with all of these Terms of Service, then you are expressly prohibited from using the Site and you must discontinue use immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. Real Estate Services</h2>
                        <p>
                            The information on this Site is provided for general informational purposes relating solely to real estate in the State of Florida. We are a licensed real estate professional, and any services provided outside the scope of informational use on this website are subject to a separate, formal representation agreement.
                        </p>
                        <p>
                            Information regarding real estate properties, including prices, availability, sq. footage, and other details is subject to change at any time without notice. We make no representations or warranties regarding the accuracy or completeness of such data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. Equal Housing Opportunity</h2>
                        <p>
                            We strictly adhere to all federal, state, and local Fair Housing laws. All real estate advertised herein is subject to the Federal Fair Housing Act, which makes it illegal to advertise any preference, limitation, or discrimination because of race, color, religion, sex, handicap, familial status, or national origin, or intention to make any such preference, limitation, or discrimination.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. Intellectual Property Rights</h2>
                        <p>
                            Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein are owned or controlled by us, and are protected by copyright and trademark laws.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Modifications and Interruptions</h2>
                        <p>
                            We reserve the right to change, modify, or remove the contents of the Site at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Site. We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the Site.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">6. Governing Law</h2>
                        <p>
                            These Terms shall be governed by and defined following the laws of the State of Florida. Nelson Vallejo Real Estate and yourself irrevocably consent that the courts of Florida shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">7. Contact Us</h2>
                        <p>In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at:</p>
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
