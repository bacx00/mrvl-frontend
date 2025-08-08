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
            By accessing and using the MRVL Esports Platform ("Platform", "Service"), you accept and agree 
            to be bound by the terms and provision of this agreement. If you do not agree to abide by the 
            above, please do not use this service.
          </p>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Binding Agreement</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>These terms constitute a legally binding agreement between you and MRVL</li>
            <li>Use of the platform indicates your acceptance of these terms</li>
            <li>If you are using the platform on behalf of an organization, you represent that you have authority to bind that organization</li>
            <li>These terms apply to all users, including visitors, registered users, and premium subscribers</li>
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
            MRVL provides a comprehensive esports platform for Marvel Rivals, including but not limited to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Match statistics, results, and live tracking</li>
            <li>Team and player profiles and rankings</li>
            <li>Tournament and event information</li>
            <li>Community forums and discussion features</li>
            <li>News and analysis content</li>
            <li>Premium analytics and insights (subscription-based)</li>
          </ul>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Service Availability</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>We strive to maintain 99.9% uptime but cannot guarantee uninterrupted service</li>
            <li>Scheduled maintenance will be announced in advance when possible</li>
            <li>Emergency maintenance may occur without prior notice</li>
            <li>Some features may be temporarily unavailable during updates</li>
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
            <li>Harassment, hate speech, or discriminatory language</li>
            <li>Spam, advertising, or commercial promotion without permission</li>
            <li>Sharing false or misleading information</li>
            <li>Attempting to hack, exploit, or disrupt platform security</li>
            <li>Using automated tools to scrape data or create fake accounts</li>
            <li>Sharing personal information of others without consent</li>
            <li>Content that violates intellectual property rights</li>
            <li>Illegal activities or content that violates applicable laws</li>
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
            <li>Copyright holders may report infringement to dmca@mrvl.gg</li>
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
            <li>Some platform features require a paid subscription</li>
            <li>Subscription fees are charged in advance on a recurring basis</li>
            <li>Prices are subject to change with 30 days' notice</li>
            <li>Premium features are only available to active subscribers</li>
          </ul>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Payment Processing</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Payments are processed by secure third-party payment processors</li>
            <li>We do not store credit card information on our servers</li>
            <li>You authorize us to charge your payment method for recurring subscriptions</li>
            <li>Failed payments may result in suspension of premium features</li>
          </ul>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Refunds and Cancellation</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Subscriptions can be cancelled at any time through account settings</li>
            <li>Cancellation takes effect at the end of the current billing period</li>
            <li>Refunds are generally not provided for partial billing periods</li>
            <li>Exceptional refunds may be considered on a case-by-case basis</li>
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
            <li>Legal notices should be sent to legal@mrvl.gg</li>
            <li>General inquiries can be directed to support@mrvl.gg</li>
            <li>DMCA notices should be sent to dmca@mrvl.gg</li>
            <li>Postal address: 123 Esports Avenue, Los Angeles, CA 90210</li>
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
          These terms govern your use of the MRVL Esports Platform. Please read them carefully 
          as they contain important information about your rights and obligations.
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
          <p>Questions about these terms? Contact us at <strong>legal@mrvl.gg</strong></p>
        </div>
      </div>
    </div>
  );
}

export default TermsPage;
