import React, { useState } from 'react';

function PrivacyPage() {
  const [activeSection, setActiveSection] = useState(null);

  const lastUpdated = 'January 15, 2025';

  const sections = [
    {
      id: 'information-collection',
      title: 'Information We Collect',
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Personal Information</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Account information (username, email address, password)</li>
            <li>Profile information (display name, avatar, preferences)</li>
            <li>Contact information when you reach out to support</li>
            <li>Payment information for premium features (processed securely by third parties)</li>
          </ul>
          
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Usage Information</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Pages visited, features used, and time spent on the platform</li>
            <li>Search queries and preferences</li>
            <li>Device information (browser type, operating system, IP address)</li>
            <li>Gaming statistics and match history when you connect your gaming accounts</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Third-Party Information</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Information from social media platforms when you choose to connect accounts</li>
            <li>Gaming platform data when you authorize integration</li>
            <li>Analytics data from third-party services</li>
          </ul>
        </div>
      )
    },
    {
      id: 'information-use',
      title: 'How We Use Your Information',
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Platform Operations</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Provide and maintain our esports platform services</li>
            <li>Personalize your experience and content recommendations</li>
            <li>Process transactions and manage subscriptions</li>
            <li>Provide customer support and respond to inquiries</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Community Features</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Enable forum discussions and community interactions</li>
            <li>Display match statistics and leaderboards</li>
            <li>Facilitate team and player connections</li>
            <li>Moderate content and ensure community safety</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Improvements and Analytics</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Analyze usage patterns to improve our services</li>
            <li>Develop new features and functionality</li>
            <li>Ensure platform security and prevent fraud</li>
            <li>Comply with legal obligations and requests</li>
          </ul>
        </div>
      )
    },
    {
      id: 'information-sharing',
      title: 'Information Sharing and Disclosure',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            We respect your privacy and do not sell your personal information. We may share information in the following circumstances:
          </p>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">With Your Consent</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>When you explicitly agree to share information with third parties</li>
            <li>When you connect external gaming accounts or social media</li>
            <li>When participating in tournaments or events that require data sharing</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Service Providers</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Cloud hosting and infrastructure providers</li>
            <li>Payment processors for subscription services</li>
            <li>Analytics services to improve platform performance</li>
            <li>Email service providers for notifications</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Legal Requirements</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>To comply with applicable laws and regulations</li>
            <li>To respond to legal requests from authorities</li>
            <li>To protect the rights and safety of our users and platform</li>
            <li>To prevent fraud and ensure platform security</li>
          </ul>
        </div>
      )
    },
    {
      id: 'data-security',
      title: 'Data Security',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            We implement comprehensive security measures to protect your personal information:
          </p>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Technical Safeguards</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>End-to-end encryption for sensitive data transmission</li>
            <li>Secure password hashing and storage</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Multi-factor authentication options for accounts</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Operational Safeguards</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Limited access to personal data on a need-to-know basis</li>
            <li>Regular employee training on data protection</li>
            <li>Incident response procedures for security breaches</li>
            <li>Regular backups and disaster recovery plans</li>
          </ul>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              <strong>Important:</strong> While we implement strong security measures, no method of transmission 
              over the internet is 100% secure. We encourage users to choose strong passwords and enable 
              two-factor authentication where available.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'user-rights',
      title: 'Your Rights and Choices',
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Access and Control</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Access and review your personal information in your account settings</li>
            <li>Update or correct your personal information at any time</li>
            <li>Download a copy of your data in a portable format</li>
            <li>Delete your account and associated data</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Communication Preferences</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Opt out of marketing emails and promotional communications</li>
            <li>Control notification settings for platform updates</li>
            <li>Manage cookie preferences through your browser settings</li>
            <li>Adjust privacy settings for public profile information</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Regional Rights</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>GDPR rights for users in the European Union</li>
            <li>CCPA rights for users in California</li>
            <li>Right to data portability and deletion</li>
            <li>Right to object to certain processing activities</li>
          </ul>

          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              To exercise any of these rights, please contact us at privacy@mrvl.gg or use the 
              data management tools in your account settings.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'cookies',
      title: 'Cookies and Tracking',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            We use cookies and similar technologies to enhance your experience:
          </p>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Essential Cookies</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Authentication and session management</li>
            <li>Security and fraud prevention</li>
            <li>Platform functionality and features</li>
            <li>User preferences and settings</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Analytics Cookies</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Usage statistics and platform performance</li>
            <li>Feature adoption and user behavior analysis</li>
            <li>Error tracking and debugging</li>
            <li>A/B testing for platform improvements</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Third-Party Services</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Google Analytics for website usage analysis</li>
            <li>Social media integration cookies</li>
            <li>Payment processor cookies for transactions</li>
            <li>Content delivery network optimization</li>
          </ul>
        </div>
      )
    },
    {
      id: 'children-privacy',
      title: 'Children\'s Privacy',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Our platform is designed for users aged 13 and older. We are committed to protecting 
            the privacy of younger users:
          </p>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Age Verification</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>We require users to confirm they are 13 or older during registration</li>
            <li>Users under 18 should have parental consent before creating accounts</li>
            <li>We may request additional verification for accounts suspected of being underage</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Special Protections</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Limited data collection for users under 18</li>
            <li>Enhanced content moderation in community areas</li>
            <li>Parental controls and oversight options</li>
            <li>Immediate account termination for users under 13</li>
          </ul>

          <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">
              <strong>Parents:</strong> If you believe your child under 13 has created an account, 
              please contact us immediately at privacy@mrvl.gg for account removal.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'updates',
      title: 'Policy Updates',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            We may update this privacy policy from time to time to reflect changes in our practices 
            or applicable laws. Here's how we handle updates:
          </p>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notification Process</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Email notification to all registered users for significant changes</li>
            <li>Platform notification banner for important updates</li>
            <li>Updated "Last Modified" date at the top of this policy</li>
            <li>Archive of previous policy versions available upon request</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Your Continued Use</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Continued use of our platform constitutes acceptance of updated terms</li>
            <li>You may delete your account if you disagree with policy changes</li>
            <li>Material changes will include a 30-day notice period when possible</li>
            <li>Emergency updates for security or legal compliance may be immediate</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-heading-1 gradient-text mb-4">Privacy Policy</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This privacy policy explains how MRVL Esports Platform collects, uses, and protects 
          your personal information when you use our services.
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-500">
          Last updated: {lastUpdated}
        </div>
      </div>

      {/* Quick Summary */}
      <div className="card p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <h2 className="text-heading-2 mb-4 text-blue-800 dark:text-blue-200">Privacy Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Secure</h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              Your data is encrypted and protected with industry-standard security measures.
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Purposeful</h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              We only collect data necessary to provide and improve our esports platform.
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">✋</div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Your Control</h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              You have full control over your data with options to access, edit, or delete.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="card p-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Quick Navigation</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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

      {/* Policy Sections */}
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

      {/* Contact Information */}
      <div className="card p-8 text-center">
        <h2 className="text-heading-2 mb-4">Questions About Privacy?</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          If you have any questions about this privacy policy or how we handle your data, 
          we're here to help.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-gray-100">Privacy Officer</div>
            <div className="text-blue-600 dark:text-blue-400">privacy@mrvl.gg</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-gray-100">General Inquiries</div>
            <div className="text-blue-600 dark:text-blue-400">support@mrvl.gg</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPage;
