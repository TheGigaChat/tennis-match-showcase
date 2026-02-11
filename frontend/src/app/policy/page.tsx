"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PolicyPage() {
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
            <h1 className="text-h2 font-semibold text-textMain">Privacy Policy</h1>
            <p className="text-h5 text-neutral">Privacy Policy - TennisMatch</p>
            <p className="text-h5 text-neutral">Last updated: January 13, 2026</p>
          </div>

          <section className="space-y-3 text-h5 text-textMain">
            <p>
              TennisMatch ("we", "our", or "us") operates the website your-domain.example.com
              (the "Website").
            </p>
            <p>
              This Privacy Policy describes how we collect, use, and protect your
              information when you visit or use our Website. By using TennisMatch, you
              agree to this Privacy Policy.
            </p>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">1. Information We Collect</h2>
            <div className="space-y-2">
              <h3 className="text-h4 font-semibold text-textMain">a) Information You Provide</h3>
              <p>We may collect personal information that you voluntarily provide, including:</p>
              <ul className="list-disc pl-5 text-neutral space-y-1">
                <li>Name and username</li>
                <li>Email address</li>
                <li>Profile information (photo, tennis level, ranking, location)</li>
                <li>Any information you submit through forms or account creation</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-h4 font-semibold text-textMain">
                b) Automatically Collected Information
              </h3>
              <p>When you visit the Website, we may automatically collect:</p>
              <ul className="list-disc pl-5 text-neutral space-y-1">
                <li>IP address</li>
                <li>Browser type and device information</li>
                <li>Pages visited and usage activity</li>
                <li>Approximate location (based on IP)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-h4 font-semibold text-textMain">c) Cookies</h3>
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc pl-5 text-neutral space-y-1">
                <li>Improve website functionality</li>
                <li>Analyze traffic and usage</li>
                <li>Maintain security</li>
              </ul>
              <p>You can disable cookies in your browser settings.</p>
            </div>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-5 text-neutral space-y-1">
              <li>Create and manage user accounts</li>
              <li>Match players and provide tennis-related services</li>
              <li>Improve website performance and features</li>
              <li>Communicate updates or support messages</li>
              <li>Prevent fraud and abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">3. Sharing of Information</h2>
            <p>We do not sell your personal information.</p>
            <p>We may share data only with:</p>
            <ul className="list-disc pl-5 text-neutral space-y-1">
              <li>Service providers (hosting, analytics, payment processing)</li>
              <li>Legal authorities if required by law</li>
              <li>Business transfers (merger, acquisition, or asset sale)</li>
            </ul>
            <p>All third parties are required to protect your information.</p>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">4. Data Retention</h2>
            <p>We keep personal data only as long as necessary to:</p>
            <ul className="list-disc pl-5 text-neutral space-y-1">
              <li>Provide services</li>
              <li>Maintain your account</li>
              <li>Comply with legal requirements</li>
            </ul>
            <p>You may request deletion of your account at any time.</p>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">5. Your Rights</h2>
            <div className="space-y-2">
              <h3 className="text-h4 font-semibold text-textMain">California Residents (CCPA)</h3>
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 text-neutral space-y-1">
                <li>Know what data we collect</li>
                <li>Request deletion of your data</li>
                <li>Opt out of data sale (we do not sell data)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-h4 font-semibold text-textMain">EU Residents (GDPR)</h3>
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 text-neutral space-y-1">
                <li>Access, correct, or delete your data</li>
                <li>Restrict or object to processing</li>
                <li>Request data portability</li>
              </ul>
              <p>Requests can be sent to: team@your-domain.example</p>
            </div>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">6. Data Security</h2>
            <p>
              We use reasonable technical and organizational measures to protect your data.
              However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">7. Children's Privacy</h2>
            <p>TennisMatch is not intended for children under the age of 18.</p>
            <p>We do not knowingly collect personal data from children.</p>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">8. Third-Party Links</h2>
            <p>The Website may contain links to third-party sites.</p>
            <p>We are not responsible for their privacy practices.</p>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time.</p>
            <p>Any changes will be posted on this page with an updated date.</p>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">10. Beta Version Notice</h2>
            <p>
              TennisMatch is currently offered as a beta version. As part of testing and
              development, we may modify, reset, or discontinue features at any time.
              When the full version of the Website is released, user data collected
              during the beta period may be deleted, and users may be required to
              register again. We are not responsible for the loss of data resulting from
              beta-related changes.
            </p>
          </section>

          <section className="space-y-3 text-h5 text-textMain">
            <h2 className="text-h3 font-semibold text-textMain">11. Contact Information</h2>
            <p>If you have any questions about this Privacy Policy, contact us at:</p>
            <p className="text-neutral">team@your-domain.example</p>
          </section>
        </main>
      </div>
    </div>
  );
}
