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
            <li>Account credentials and authentication data (username, email address, securely hashed passwords)</li>
            <li>Profile and personalization data (display name, avatar, user preferences, notification settings)</li>
            <li>Communication records when you interact with our support team or community features</li>
            <li>Financial information for premium subscriptions (processed through PCI-compliant third-party payment processors)</li>
            <li>Identity verification data when required for competitive tournaments or age verification</li>
          </ul>
          
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Usage Information</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Platform usage analytics (pages visited, features accessed, session duration, click patterns)</li>
            <li>Search queries, filter preferences, and content interaction data</li>
            <li>Technical device information (browser type, version, operating system, IP address, unique device identifiers)</li>
            <li>Gaming performance data and match statistics when you authorize account linking</li>
            <li>Geolocation data (country/region level) for content localization and legal compliance</li>
            <li>Error logs and diagnostic information to improve platform stability</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Third-Party Information</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Social media profile information when you authorize account linking (public profile data only)</li>
            <li>Gaming platform statistics and achievements when you connect external gaming accounts</li>
            <li>Aggregated analytics data from trusted third-party services (Google Analytics, etc.)</li>
            <li>Tournament and event data from official Marvel Rivals competitions</li>
            <li>Community-generated content and public match results from official game APIs</li>
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
            <li>Deliver, maintain, and continuously improve our esports platform services</li>
            <li>Personalize user experience through tailored content, match recommendations, and interface customization</li>
            <li>Process secure payments, manage premium subscriptions, and handle billing inquiries</li>
            <li>Provide comprehensive customer support, technical assistance, and respond to user inquiries</li>
            <li>Ensure platform security, detect fraud, and prevent unauthorized access</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Community Features</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Enable community engagement through forums, discussions, and social features</li>
            <li>Generate and display comprehensive match statistics, rankings, and competitive leaderboards</li>
            <li>Facilitate professional networking between teams, players, and organizations</li>
            <li>Implement content moderation and maintain a safe, inclusive community environment</li>
            <li>Organize and manage esports tournaments, events, and competitions</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Improvements and Analytics</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Conduct data analytics to understand user behavior and optimize platform performance</li>
            <li>Research and develop innovative features based on community feedback and industry trends</li>
            <li>Maintain robust cybersecurity measures and protect against malicious activities</li>
            <li>Fulfill legal obligations, regulatory compliance, and respond to lawful government requests</li>
            <li>Generate insights for the esports industry while protecting individual privacy</li>
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
            MRVL is committed to protecting your privacy. We never sell, rent, or trade your personal information to third parties for commercial purposes. We may share limited information only in the specific circumstances outlined below:
          </p>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">With Your Consent</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>When you provide explicit, informed consent for specific data sharing purposes</li>
            <li>When you voluntarily connect external gaming platforms or social media accounts</li>
            <li>When participating in official tournaments, competitions, or events that require verification and results reporting</li>
            <li>When you publicly share content through community features (forums, comments, public profiles)</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Service Providers</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Trusted cloud hosting and infrastructure providers who maintain strict data protection standards</li>
            <li>PCI-compliant payment processors for secure transaction processing</li>
            <li>Analytics and monitoring services that help us improve platform performance and user experience</li>
            <li>Communication service providers for essential platform notifications and updates</li>
            <li>Security services that help protect against fraud, abuse, and cybersecurity threats</li>
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
            MRVL employs enterprise-grade security measures and follows industry best practices to protect your personal information from unauthorized access, disclosure, alteration, or destruction:
          </p>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Technical Safeguards</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Advanced encryption protocols (TLS 1.3+) for all data transmission and storage</li>
            <li>Industry-standard password hashing using bcrypt with salt</li>
            <li>Regular third-party security audits, penetration testing, and vulnerability assessments</li>
            <li>Multi-factor authentication (MFA) support for enhanced account security</li>
            <li>Real-time monitoring and intrusion detection systems</li>
            <li>Secure API endpoints with rate limiting and authentication requirements</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Operational Safeguards</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Strict access controls with role-based permissions and need-to-know principles</li>
            <li>Comprehensive employee training on data protection, GDPR compliance, and security protocols</li>
            <li>Detailed incident response procedures with immediate breach notification protocols</li>
            <li>Automated backup systems with encrypted off-site storage and tested disaster recovery procedures</li>
            <li>Data retention policies that automatically purge unnecessary personal information</li>
            <li>Regular security awareness training and phishing simulation exercises</li>
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
              To exercise any of these rights, please use the data management tools in your account settings 
              or contact our support team through the official channels provided on our platform.
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
              please contact our support team immediately through the official channels provided on our platform for account removal.
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
          This comprehensive privacy policy outlines how MRVL Esports Platform ("MRVL", "we", "us", or "our") 
          collects, processes, stores, and protects your personal information when you access or use our 
          Marvel Rivals esports platform and related services.
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
        <div className="flex justify-center">
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-gray-100">Contact Support</div>
            <div className="text-blue-600 dark:text-blue-400">Use the contact form or support chat available on our platform</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPage;
