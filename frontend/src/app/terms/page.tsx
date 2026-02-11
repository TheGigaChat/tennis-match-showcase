"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TermsPage() {
  const router = useRouter();
  const [useFallbackBack, setUseFallbackBack] = useState(false);

  return (
    <div className="min-h-dvh bg-bg">
      <div className="mx-auto w-full max-w-phone px-6 py-8 min-h-dvh flex flex-col">
        <header className="w-full text-left">
          <button
            onClick={() => router.back()}
            className={
              useFallbackBack
                ? "text-main text-h4 font-medium hover:opacity-80"
                : "rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800/60"
            }
            aria-label="Back"
          >
            {useFallbackBack ? (
              "Back"
            ) : (
              <Image
                src="/arrow-back-dark.svg"
                alt=""
                width={22}
                height={22}
                onError={() => setUseFallbackBack(true)}
              />
            )}
          </button>
        </header>

        <main className="mt-6 flex flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-h2 font-semibold text-textMain">Terms and Conditions</h1>
            <p className="text-h5 text-neutral">TennisMatch</p>
            <p className="text-h5 text-neutral">Last updated: December 26, 2025</p>
          </div>

          <section className="space-y-3 text-h5 text-textMain">
            <p>
              Welcome to TennisMatch ("we", "our", or "us"). These Terms and
              Conditions ("Terms") govern your use of the your-domain.example.com website
              (the "Website").
            </p>
            <p>
              By accessing or using TennisMatch, you agree to be bound by these Terms.
              If you do not agree, do not use the Website.
            </p>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">1. Beta Version Notice</h2>
            <p>
              TennisMatch is currently provided as a beta version. The Website and its
              features are offered "as is" and "as available" for testing and
              development purposes.
            </p>
            <p>
              We may modify, suspend, reset, or discontinue any part of the Website at
              any time without notice.
            </p>
            <p>
              User data created during the beta period may be deleted, and users may be
              required to register again when the full version launches.
            </p>
            <p>
              We are not responsible for any loss of data, matches, rankings, or content
              resulting from beta-related changes.
            </p>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">2. Eligibility</h2>
            <p>You must be at least 13 years old to use TennisMatch.</p>
            <p>By using the Website, you represent that you meet this requirement.</p>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">3. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account information.</p>
            <p>You agree to provide accurate and complete information.</p>
            <p>We reserve the right to suspend or terminate accounts that violate these Terms.</p>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">4. Use of the Website</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 text-neutral space-y-1">
              <li>Use the Website for unlawful purposes</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Misrepresent your identity or tennis ability</li>
              <li>Attempt to gain unauthorized access to the Website</li>
              <li>Upload malicious code or spam</li>
            </ul>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">5. Tennis Matchmaking Disclaimer</h2>
            <p>
              TennisMatch facilitates connections between players but does not guarantee
              match quality, availability, safety, or outcomes.
            </p>
            <p>
              Users are solely responsible for their interactions, conduct, and any
              matches arranged through the Website.
            </p>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">6. Payments and Subscriptions</h2>
            <p>
              If paid features are offered, payments will be processed through third-party
              providers.
            </p>
            <p>We do not store payment card information.</p>
            <p>All fees are non-refundable unless required by law.</p>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">7. Intellectual Property</h2>
            <p>
              All content, branding, and materials on TennisMatch are owned by or licensed
              to us.
            </p>
            <p>You may not copy, distribute, or exploit content without permission.</p>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">8. User Content</h2>
            <p>
              You retain ownership of content you submit but grant us a non-exclusive,
              worldwide license to use it for operating and improving the Website.
            </p>
            <p>We reserve the right to remove content that violates these Terms.</p>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">9. Termination</h2>
            <p>
              We may suspend or terminate your access to the Website at any time for any
              reason, including violation of these Terms.
            </p>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, TennisMatch shall not be liable for
              any indirect, incidental, or consequential damages arising from your use of
              the Website.
            </p>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">11. Indemnification</h2>
            <p>
              You agree to indemnify and hold TennisMatch harmless from claims arising out
              of your use of the Website or violation of these Terms.
            </p>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">12. Governing Law</h2>
            <p>
              These Terms shall be governed by the laws of the State of California, United
              States.
            </p>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">13. Changes to These Terms</h2>
            <p>
              We may update these Terms at any time. Continued use of the Website
              constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">14. Contact</h2>
            <p>If you have any questions about these Terms, contact us at:</p>
            <p className="text-neutral">team@your-domain.example</p>
          </section>
        </main>
      </div>
    </div>
  );
}
