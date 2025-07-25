import React, { useState } from 'react';

function TermsPage() {
  const [activeSection, setActiveSection] = useState(null);

  const lastUpdated = 'January 15, 2025';

  const sections = [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            By accessing, browsing, or using the MRVL Esports Platform ("Platform", "Service", "MRVL"), 
            you acknowledge that you have read, understood, and agree to be legally bound by these Terms of Service 
            and our Privacy Policy. If you do not agree with any part of these terms, you must immediately 
            discontinue use of our platform and services.
          </p>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Binding Agreement</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>These terms create a legally enforceable contract between you and MRVL Esports Platform</li>
            <li>Continued use of the platform constitutes ongoing acceptance of these terms and any updates</li>
            <li>If accessing on behalf of a company or organization, you warrant that you have full legal authority to bind that entity</li>
            <li>These terms apply universally to all users, including anonymous visitors, registered members, premium subscribers, and tournament participants</li>
            <li>Certain features may have additional terms that supplement but do not replace these general terms</li>
          </ul>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Eligibility</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>You must be at least 13 years old to use this platform</li>
            <li>Users between 13-18 years old must have parental consent</li>
            <li>You must provide accurate and complete information during registration</li>
            <li>You are responsible for maintaining the confidentiality of your account</li>
          </ul>
        </div>
      )
    },
    {
      id: 'services',
      title: 'Platform Services',
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Service Description</h4>
          <p className="text-gray-600 dark:text-gray-400">
            MRVL operates as the premier esports platform dedicated to Marvel Rivals, providing comprehensive services including:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Real-time match tracking, detailed statistics, and comprehensive results database</li>
            <li>Professional team management, player profiles, competitive rankings, and leaderboards</li>
            <li>Tournament organization, event scheduling, and competition management tools</li>
            <li>Community engagement features including forums, discussions, and social networking</li>
            <li>Editorial content, news coverage, expert analysis, and strategic insights</li>
            <li>Advanced analytics, performance metrics, and professional-grade data insights (premium subscription required)</li>
            <li>Educational resources, guides, and training materials for competitive improvement</li>
            <li>Integration with official Marvel Rivals APIs and external gaming platforms</li>
          </ul>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Service Availability</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>We maintain enterprise-level infrastructure targeting 99.9% uptime, though we cannot guarantee completely uninterrupted service</li>
            <li>Planned maintenance will be announced at least 24 hours in advance through platform notifications and social media</li>
            <li>Emergency maintenance for security or critical issues may occur with minimal notice</li>
            <li>Platform features may be temporarily limited during major updates, with advance notification when possible</li>
            <li>Third-party integrations (gaming platforms, social media) may experience independent service interruptions</li>
          </ul>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Account Registration</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>You may browse public content without registration</li>
            <li>Registration is required for community features and personalization</li>
            <li>One account per person; sharing accounts is prohibited</li>
            <li>You are responsible for all activity on your account</li>
          </ul>
        </div>
      )
    },
    {
      id: 'user-conduct',
      title: 'User Conduct and Content',
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Acceptable Use</h4>
          <p className="text-gray-600 dark:text-gray-400">
            You agree to use the platform in accordance with these guidelines:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Respect other users and maintain a positive community environment</li>
            <li>Provide accurate information and avoid impersonation</li>
            <li>Use the platform for its intended purpose of esports discussion and information</li>
            <li>Report violations of these terms or inappropriate content</li>
          </ul>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Prohibited Activities</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Harassment, cyberbullying, hate speech, or any form of discriminatory language based on race, gender, religion, or other protected characteristics</li>
            <li>Spam, unsolicited advertising, commercial promotion, or affiliate marketing without explicit platform authorization</li>
            <li>Deliberately sharing false information, misinformation, or engaging in defamatory statements about players, teams, or organizations</li>
            <li>Attempting to hack, exploit vulnerabilities, circumvent security measures, or disrupt platform infrastructure</li>
            <li>Using bots, automated scripts, data scraping tools, or creating multiple fake accounts to manipulate platform features</li>
            <li>Doxxing, sharing personal information of others without consent, or violating privacy rights</li>
            <li>Copyright infringement, trademark violations, or unauthorized use of intellectual property</li>
            <li>Any illegal activities, promotion of illegal substances, or content that violates local, national, or international laws</li>
            <li>Impersonating other users, teams, organizations, or MRVL staff members</li>
            <li>Manipulating match results, engaging in match-fixing, or other forms of competitive fraud</li>
          </ul>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">User-Generated Content</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>You retain ownership of content you create on the platform</li>
            <li>By posting content, you grant us a license to display and distribute it</li>
            <li>You are responsible for ensuring your content doesn't violate third-party rights</li>
            <li>We reserve the right to remove content that violates these terms</li>
          </ul>
        </div>
      )
    },
    {
      id: 'intellectual-property',
      title: 'Intellectual Property Rights',
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Platform Content</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>All platform content, design, and functionality is owned by MRVL or its licensors</li>
            <li>Platform content is protected by copyright, trademark, and other intellectual property laws</li>
            <li>You may not copy, modify, distribute, or reverse engineer platform components</li>
            <li>Limited personal use of platform content is permitted for non-commercial purposes</li>
          </ul>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Third-Party Content</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Marvel Rivals game content is owned by NetEase Games and related parties</li>
            <li>Team logos, player images, and tournament branding belong to their respective owners</li>
            <li>We use such content under fair use provisions for news and educational purposes</li>
            <li>Rights holders may request removal of their content by contacting us</li>
          </ul>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">DMCA Compliance</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>We respect copyright and respond to valid DMCA takedown notices</li>
            <li>Copyright holders may report infringement through our DMCA contact form available on the platform</li>
            <li>Users who repeatedly infringe copyright may have their accounts terminated</li>
            <li>Counter-notices may be filed for content removed in error</li>
          </ul>
        </div>
      )
    },
    {
      id: 'privacy-data',
      title: 'Privacy and Data Protection',
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Data Collection and Use</h4>
          <p className="text-gray-600 dark:text-gray-400">
            Our data practices are governed by our Privacy Policy, which is incorporated by reference 
            into these terms. Key points include:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>We collect information necessary to provide and improve our services</li>
            <li>Personal information is protected and not sold to third parties</li>
            <li>You have rights to access, correct, and delete your personal data</li>
            <li>We use cookies and analytics to improve platform performance</li>
          </ul>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Data Security</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>We implement industry-standard security measures to protect user data</li>
            <li>Data is encrypted in transit and at rest</li>
            <li>Access to personal data is limited to authorized personnel</li>
            <li>Security incidents are handled according to our incident response procedures</li>
          </ul>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">International Data Transfers</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Data may be processed in countries different from where you are located</li>
            <li>We ensure adequate protection for international data transfers</li>
            <li>EU users' data is protected under GDPR-compliant frameworks</li>
          </ul>
        </div>
      )
    },
    {
      id: 'payments',
      title: 'Payments and Subscriptions',
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Premium Services</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Premium platform features require an active paid subscription with tiered pricing options</li>
            <li>Subscription fees are charged in advance on a monthly or annual recurring basis as selected during signup</li>
            <li>Pricing is subject to change with 30 days' advance notice to existing subscribers</li>
            <li>Premium features including advanced analytics, priority support, and exclusive content are only available to active subscribers</li>
            <li>Free trial periods may be offered for new subscribers with automatic conversion to paid plans unless cancelled</li>
          </ul>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Payment Processing</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>All payments are processed through PCI-compliant third-party payment processors including Stripe and PayPal</li>
            <li>MRVL does not store, process, or have access to your complete credit card information</li>
            <li>By subscribing, you authorize automatic recurring charges to your selected payment method until cancellation</li>
            <li>Failed payment attempts will result in email notifications and potential suspension of premium features after a grace period</li>
            <li>We accept major credit cards, PayPal, and other regionally available payment methods</li>
          </ul>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Refunds and Cancellation</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Subscriptions can be cancelled at any time through your account settings or by contacting customer support</li>
            <li>Cancellations take effect at the end of your current billing cycle, allowing access to premium features until that date</li>
            <li>Refunds are generally not provided for unused portions of billing periods, consistent with industry standards</li>
            <li>Exceptional circumstances may warrant partial refunds, evaluated on a case-by-case basis by our customer support team</li>
            <li>Chargebacks or disputed payments may result in immediate account suspension pending resolution</li>
          </ul>
        </div>
      )
    },
    {
      id: 'disclaimers',
      title: 'Disclaimers and Limitations',
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Service Disclaimers</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>The platform is provided "as is" without warranties of any kind</li>
            <li>We do not guarantee the accuracy or completeness of match data</li>
            <li>Third-party content and links are provided for convenience only</li>
            <li>We are not responsible for decisions made based on platform information</li>
          </ul>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Limitation of Liability</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Our liability is limited to the maximum extent permitted by law</li>
            <li>We are not liable for indirect, consequential, or punitive damages</li>
            <li>Total liability is limited to the amount paid for premium services in the past 12 months</li>
            <li>Some jurisdictions do not allow limitation of certain damages</li>
          </ul>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Indemnification</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>You agree to indemnify MRVL against claims arising from your use of the platform</li>
            <li>This includes claims related to your content or violation of these terms</li>
            <li>We will notify you of any such claims and cooperate in defense</li>
          </ul>
        </div>
      )
    },
    {
      id: 'termination',
      title: 'Termination and Suspension',
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Account Termination</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>You may delete your account at any time through account settings</li>
            <li>We may suspend or terminate accounts for violations of these terms</li>
            <li>Termination may be immediate for serious violations or illegal activity</li>
            <li>We will provide notice when possible, except for emergency situations</li>
          </ul>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Effect of Termination</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Terminated accounts lose access to premium features immediately</li>
            <li>Personal data may be retained as required by law or legitimate business interests</li>
            <li>Some content may remain visible if it has been shared publicly</li>
            <li>Outstanding payment obligations survive termination</li>
          </ul>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Service Discontinuation</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>We reserve the right to discontinue the platform with reasonable notice</li>
            <li>Users will be provided with data export options when possible</li>
            <li>Refunds for prepaid services may be provided at our discretion</li>
          </ul>
        </div>
      )
    },
    {
      id: 'general',
      title: 'General Provisions',
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Changes to Terms</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>We may update these terms to reflect changes in our services or law</li>
            <li>Significant changes will be communicated via email and platform notifications</li>
            <li>Continued use after changes constitutes acceptance of updated terms</li>
            <li>Material changes will include a reasonable notice period when possible</li>
          </ul>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Governing Law</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>These terms are governed by the laws of the State of California, USA</li>
            <li>Disputes will be resolved in the courts of Los Angeles County, California</li>
            <li>International users may have additional rights under local law</li>
            <li>If any provision is unenforceable, the remainder of terms remain in effect</li>
          </ul>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Contact Information</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Legal notices should be sent through our official contact form</li>
            <li>General inquiries can be directed to our support team via the platform</li>
            <li>DMCA notices should be submitted through our dedicated DMCA contact form</li>
            <li>Official correspondence address available upon request through our platform</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-heading-1 gradient-text mb-4">Terms of Service</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          These comprehensive Terms of Service ("Terms") constitute a legally binding agreement between you and MRVL 
          governing your access to and use of the MRVL Esports Platform. Please read these terms carefully as they 
          contain important information about your rights, obligations, and limitations of liability.
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-500">
          Last updated: {lastUpdated}
        </div>
      </div>

      {/* Quick Agreement */}
      <div className="card p-6 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <h2 className="text-heading-2 mb-4 text-green-800 dark:text-green-200">Terms Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl mb-2">🤝</div>
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Fair Use</h3>
            <p className="text-green-700 dark:text-green-300 text-sm">
              Use our platform respectfully and in accordance with community guidelines.
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🛡️</div>
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Your Rights</h3>
            <p className="text-green-700 dark:text-green-300 text-sm">
              You retain ownership of your content and have control over your personal data.
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">⚖️</div>
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Mutual Respect</h3>
            <p className="text-green-700 dark:text-green-300 text-sm">
              We provide quality service while you follow our community guidelines.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="card p-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Quick Navigation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
              className="text-left text-sm text-blue-600 dark:text-blue-400 hover:underline p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              {section.title}
            </button>
          ))}
        </div>
      </div>

      {/* Terms Sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.id} className="card">
            <button
              onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
              className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <h2 className="text-heading-2">{section.title}</h2>
              <span className="text-2xl">
                {activeSection === section.id ? '−' : '+'}
              </span>
            </button>
            
            {activeSection === section.id && (
              <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
                <div className="pt-6">
                  {section.content}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Agreement Confirmation */}
      <div className="card p-8 text-center bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <h2 className="text-heading-2 mb-4 text-blue-800 dark:text-blue-200">Agreement Confirmation</h2>
        <p className="text-blue-700 dark:text-blue-300 mb-6">
          By continuing to use the MRVL Esports Platform, you acknowledge that you have read, 
          understood, and agree to be bound by these Terms of Service.
        </p>
        <div className="text-sm text-blue-600 dark:text-blue-400">
          <p>Questions about these terms? Contact our legal team through the official support channels on our platform</p>
        </div>
      </div>
    </div>
  );
}

export default TermsPage;
