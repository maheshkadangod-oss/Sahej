import { Heart, ArrowLeft } from 'lucide-react';

// Standalone privacy policy page, served at /privacy (like /share/* and /report/print).
// Written in plain language and kept honest to the actual implementation — if the code
// changes what's collected, this page must change with it.
export default function PrivacyView() {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-brand-cream text-brand-ink">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-brand-clay mb-8 min-h-[44px]">
          <ArrowLeft className="w-4 h-4" /> Back to Sahej
        </a>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-brand-rose/20 rounded-full flex items-center justify-center">
            <Heart className="w-5 h-5 text-brand-rose" />
          </div>
          <h1 className="text-3xl font-serif font-semibold">Privacy Policy</h1>
        </div>
        <p className="text-sm text-brand-sage mb-10">Sahej · Effective June 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-brand-ink/85">
          <section>
            <h2 className="text-xl font-serif font-medium mb-2">The short version</h2>
            <p>
              Your story stays yours. Almost everything you write in Sahej — moods, journals,
              chats with Asha, your baby's logs — lives <strong>on your device</strong>, not on our
              servers. We collect the minimum we need to run the app, we never sell data, and we
              show no ads. You can delete everything at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif font-medium mb-2">What stays on your device</h2>
            <p>
              Mood entries, journal and gratitude entries, chat history with Asha, memory vault
              items, sleep / water / kegel logs, baby feeding and weight logs, vaccination records,
              and your preferences. These are stored in your browser's local storage and never
              uploaded. If you clear your browser data or use "Reset App", they're gone — we have
              no copy. You can download a backup any time with "Export My Data" in Settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif font-medium mb-2">What we store on our servers</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Your sign-up details</strong> — name, email, and (if you shared them) your
                baby's name and birth date. Used to personalize the app and, rarely, to send you
                important updates about Sahej.
              </li>
              <li>
                <strong>Share-link snapshots</strong> — if you tap "Share with Family", a summary of
                your recent mood trend (never your chats or journals) is stored so your link works.
                It expires and is deleted automatically after 30 days.
              </li>
              <li>
                <strong>Push reminders</strong> — if you enable notifications, we store your device's
                push subscription and the reminder schedule (e.g. vaccine due dates) so reminders can
                reach you when the app is closed.
              </li>
              <li>
                <strong>Feedback</strong> — anything you send through the feedback form.
              </li>
              <li>
                <strong>Anonymous usage counts</strong> — a random device identifier (no name, no
                email, no fingerprinting) so we can count visitors. It cannot be traced back to you.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-serif font-medium mb-2">Talking with Asha</h2>
            <p>
              When you chat with Asha, your messages are sent through our server to Google's Gemini
              API to generate a response, then returned to you. We do not store your conversations
              on our servers — your chat history lives only on your device. Crisis detection runs
              entirely on your device and works even offline.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif font-medium mb-2">Deleting your data</h2>
            <p>
              In Settings you'll find <strong>"Delete my data"</strong> — it removes your sign-up
              record from our servers, unsubscribes your device from notifications, and wipes
              everything stored locally. No questions, no retention period, no "are you sure you
              really want to leave" emails.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif font-medium mb-2">What we never do</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>We never sell or share your data with advertisers or data brokers.</li>
              <li>We show no ads.</li>
              <li>We never read or upload your journals, chats, or mood entries.</li>
              <li>We never contact the people in your trusted contacts — those exist only on your device for <em>you</em> to reach.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-serif font-medium mb-2">A note on what Sahej is</h2>
            <p>
              Sahej is a wellness companion, not a medical device, and Asha is not a clinician. The
              EPDS screening and health content are general reference, reviewed for accuracy, but
              they don't replace professional medical advice. If you are in crisis, please use the
              emergency helplines in the Help tab or contact local emergency services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif font-medium mb-2">Questions</h2>
            <p>
              The easiest way to reach us is the feedback form in Settings — it goes straight to the
              people who build Sahej. We'll update this page whenever our practices change, and the
              effective date above will tell you when.
            </p>
          </section>
        </div>

        <p className="text-xs text-brand-sage/70 mt-12 pb-8">Sahej · Made with love for every mama</p>
      </div>
    </div>
  );
}
