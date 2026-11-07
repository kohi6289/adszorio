// Starting drafts for the legal pages, editable in /admin/legal_pages.
// They are honest templates, NOT legal advice: have them reviewed by a lawyer before launch.
// [BRACKETED] text must be filled in by the owner.

export const legalPages = [
  {
    slug: "terms",
    title: "Terms of Service",
    body: `These Terms govern your use of adszorio.com and the services we sell. By placing an order you agree to them.

## 1. What we sell
We sell social media promotion services (for example views, likes, followers and comments) for third-party platforms such as YouTube and Instagram. Each service page states its price, quantity limits, start time, speed, refill period and, in plain language, how the engagement is delivered. Please read the delivery method before you order.

## 2. No guarantees beyond the refill period
Platforms can remove engagement, limit reach or take action on accounts at any time and for any reason. We do not guarantee any result such as monetisation, ranking, reach, sales or account standing. If a delivered count drops during a service's refill period we will top it up free of charge. After the refill period ends, results are not guaranteed.

## 3. Your responsibilities
- You must own the account or content, or be authorised by its owner.
- The account and content must be public while the order runs.
- You must not order services for unlawful content or to mislead consumers in breach of laws that apply to you (for example advertising and consumer protection laws).
- We will never ask for your password. Do not send it to us.

## 4. Orders and payment
Prices are calculated in US dollars; other currencies are shown for convenience. After you place an order we email payment instructions. Work starts once payment is confirmed. We may decline or cancel any order, in which case any payment is refunded.

## 5. Refunds, refills and chargebacks
See our [Refund & Refill Policy](/legal/refund-refill) and [Chargeback Policy](/legal/chargeback).

## 6. Liability
To the extent permitted by law, our total liability for any order is limited to the amount you paid for it. Nothing in these Terms limits rights you have under consumer law that cannot be excluded.

## 7. Platform affiliation
We are not affiliated with, endorsed by, or sponsored by YouTube, Google, Instagram or Meta. Platform names are used only to describe compatibility.

## 8. Governing law
These Terms are governed by the laws of [GOVERNING LAW / JURISDICTION]. Consumers keep the protection of mandatory laws of their country of residence.

## 9. Contact
[LEGAL BUSINESS NAME], [ADDRESS]. Email: [EMAIL].`,
  },
  {
    slug: "refund-refill",
    title: "Refund & Refill Policy",
    body: `## Refills
If a delivered count drops during the refill period shown on the service page, contact us with your order code and we will top it up free of charge. Refills cover drops only; they do not cover content that was deleted, made private or changed after ordering.

## Refunds
- **Not started:** if we have not started your order, you can cancel for a full refund.
- **Cannot deliver:** if we cannot deliver all or part of an order, we refund the undelivered portion.
- **Partially delivered:** orders marked as partial are refunded proportionally for the undelivered quantity.
- **Delivered:** completed orders are not refundable, because the service has been performed. This does not affect rights you have under consumer law that cannot be excluded.

Refunds are made to the original payment method where possible, within [X] business days of approval.

## How to ask
Email [EMAIL] with your order code. We reply within [X] business hours.`,
  },
  {
    slug: "chargeback",
    title: "Chargeback Policy",
    body: `If something is wrong with an order, please contact us first: most issues are resolved quickly with a refill or refund.

Before starting work we record the starting count of your profile, post or video, and after delivery we record the delivered count and keep screenshots. If a chargeback or payment dispute is opened for a delivered order, we will share this evidence, our order records and your acceptance of our Terms with the payment provider.

Opening a dispute for a delivered order may lead us to decline future orders from you.`,
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    body: `This policy explains what personal data [LEGAL BUSINESS NAME] ("we") collects and how we use it. It is written to meet the EU GDPR, UK GDPR and the California Consumer Privacy Act (CCPA/CPRA).

## Data we collect
- **Order data:** name, email, optional phone number, country, time zone, the public link you submit, order details and payment references.
- **Contact data:** what you send through our contact form, email, WhatsApp or Telegram.
- **Technical data:** IP-based country, browser information, and cookies (see our [Cookie Policy](/legal/cookies)).

We never ask for, and do not store, your social media passwords.

## Why we use it (legal bases)
- To process and deliver your order and talk to you about it (contract).
- To prevent fraud and handle chargebacks (legitimate interests).
- To meet tax and accounting obligations (legal obligation).
- Analytics and marketing cookies only with your consent.

## Sharing
We share data only with service providers that help us run the business (hosting, database, email delivery, payment processors, and suppliers that fulfil orders, who receive only the public link and quantity). We do not sell your personal information.

## International transfers
We are based in India and use providers in other countries. Where required we rely on appropriate safeguards such as Standard Contractual Clauses.

## Retention
Order records are kept for [X] years for accounting and dispute purposes; contact enquiries for [X] months.

## Your rights
Depending on where you live, you can ask to access, correct, export or delete your data, object to or restrict processing, and withdraw consent. California residents can opt out of the sale or sharing of personal information on our [Do Not Sell or Share](/privacy/do-not-sell) page. Make a request on our [privacy request](/privacy/request) page or email [EMAIL]. You can also complain to your local data protection authority.

## Contact
[LEGAL BUSINESS NAME], [ADDRESS]. Email: [EMAIL].`,
  },
  {
    slug: "cookies",
    title: "Cookie Policy",
    body: `## Necessary cookies (always on)
- **adz_ccy:** remembers your display currency.
- **adz_consent:** remembers your cookie choices.
- **theme:** remembers light or dark mode (stored in your browser).

## Analytics cookies (opt-in)
Used only if you allow them, to understand how the site is used.

## Marketing cookies (opt-in)
Used only if you allow them, to measure ads. They are always off when your browser sends a Global Privacy Control signal.

You can change your choice at any time with **Cookie settings** in the footer.`,
  },
];
