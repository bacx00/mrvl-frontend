import React, { useState } from 'react';

const CommunityGuidelines = ({ 
  isModal = false, 
  onClose = null, 
  showTitle = true,
  compact = false 
}) => {
  const [activeSection, setActiveSection] = useState('overview');

  const guidelines = {
    overview: {
      title: 'Community Guidelines Overview',
      icon: '📋',
      content: [
        {
          title: 'Our Mission',
          text: 'MRVL is dedicated to creating a positive, inclusive, and competitive environment for Marvel Rivals players of all skill levels. These guidelines help ensure everyone can enjoy discussing strategies, sharing clips, and building friendships.'
        },
        {
          title: 'Core Principles',
          items: [
            'Respect all community members regardless of skill level, background, or playstyle',
            'Keep discussions constructive and on-topic',
            'Help create a welcoming environment for new players',
            'Support fair play and sportsmanship',
            'Report violations to help maintain community standards'
          ]
        },
        {
          title: 'Quick Reference',
          text: 'Use the tabs below to explore specific guidelines. When in doubt, ask yourself: "Does this contribute positively to our community?"'
        }
      ]
    },
    respect: {
      title: 'Respect & Conduct',
      icon: '🤝',
      content: [
        {
          title: 'Respectful Communication',
          items: [
            'Use appropriate language and tone in all interactions',
            'Avoid personal attacks, insults, or inflammatory language',
            'Respect different opinions and playstyles',
            'Be patient with players learning the game',
            'Use constructive criticism rather than harsh judgment'
          ]
        },
        {
          title: 'Prohibited Behavior',
          items: [
            'Harassment, bullying, or targeted abuse',
            'Discrimination based on race, gender, religion, sexuality, or nationality',
            'Doxxing or sharing personal information without consent',
            'Threats of violence or self-harm',
            'Coordinated harassment or brigading'
          ]
        },
        {
          title: 'Conflict Resolution',
          text: 'Disagreements happen, but handle them maturely. If you cant resolve an issue directly, use the report system or contact moderators. Never escalate conflicts or engage in public arguments.'
        }
      ]
    },
    content: {
      title: 'Content Standards',
      icon: '📝',
      content: [
        {
          title: 'Quality Content',
          items: [
            'Post original, relevant content related to Marvel Rivals',
            'Use descriptive titles that accurately represent your content',
            'Search before posting to avoid duplicates',
            'Credit sources when sharing others work',
            'Provide context for clips, screenshots, or discussions'
          ]
        },
        {
          title: 'Prohibited Content',
          items: [
            'Spam, repetitive posts, or low-effort content',
            'NSFW content, graphic violence, or disturbing imagery',
            'Pirated content, cheats, hacks, or exploits',
            'Misleading information or intentional misinformation',
            'Commercial spam or unauthorized advertising'
          ]
        },
        {
          title: 'Media Guidelines',
          text: 'When sharing gameplay clips, screenshots, or fan art, ensure they follow community standards. Mark spoilers appropriately and respect intellectual property rights.'
        }
      ]
    },
    gaming: {
      title: 'Gaming Conduct',
      icon: '🎮',
      content: [
        {
          title: 'Fair Play',
          items: [
            'Play honestly and avoid exploiting bugs or glitches',
            'Respect your teammates and opponents',
            'Communicate constructively during matches',
            'Accept wins and losses gracefully',
            'Help newer players learn rather than criticizing their performance'
          ]
        },
        {
          title: 'Prohibited Practices',
          items: [
            'Cheating, hacking, or using unauthorized third-party software',
            'Account sharing or boosting services',
            'Griefing, trolling, or intentionally ruining games',
            'Toxic behavior in voice or text chat',
            'Leaving ranked matches or AFK behavior'
          ]
        },
        {
          title: 'Competitive Integrity',
          text: 'Maintain the integrity of competitive play. Report suspected cheaters and avoid any behavior that gives unfair advantages.'
        }
      ]
    },
    moderation: {
      title: 'Moderation & Enforcement',
      icon: '⚖️',
      content: [
        {
          title: 'Reporting System',
          items: [
            'Report violations using the report button on posts and comments',
            'Provide clear, specific reasons when reporting',
            'Don\'t make false reports or abuse the reporting system',
            'Be patient - moderators review reports as quickly as possible',
            'Use the report system rather than starting public arguments'
          ]
        },
        {
          title: 'Enforcement Actions',
          items: [
            'Warnings: First violations typically result in a warning',
            'Temporary Restrictions: Limited posting or commenting privileges',
            'Temporary Bans: Short-term removal from the community',
            'Permanent Bans: Reserved for severe or repeated violations',
            'Content Removal: Inappropriate content will be deleted'
          ]
        },
        {
          title: 'Appeals Process',
          text: 'If you believe a moderation action was taken in error, you can appeal by contacting the moderation team. Provide specific details and remain respectful during the appeals process.'
        }
      ]
    },
    privacy: {
      title: 'Privacy & Safety',
      icon: '🔒',
      content: [
        {
          title: 'Personal Information',
          items: [
            'Never share personal information (real names, addresses, phone numbers)',
            'Don\'t share account credentials or personal gaming statistics',
            'Be cautious when joining external Discord servers or communities',
            'Report any attempts to gather personal information',
            'Use strong, unique passwords for your accounts'
          ]
        },
        {
          title: 'Online Safety',
          items: [
            'Be skeptical of offers that seem too good to be true',
            'Don\'t click suspicious links or download unknown files',
            'Report scam attempts or malicious behavior',
            'Keep your gaming and social media accounts secure',
            'Trust your instincts if something feels wrong'
          ]
        },
        {
          title: 'Minor Safety',
          text: 'Special protections apply to users under 18. Adults should maintain appropriate boundaries, and any concerning behavior involving minors should be reported immediately.'
        }
      ]
    }
  };

  const sectionKeys = Object.keys(guidelines);

  const renderContent = (content) => {
    return content.map((item, index) => (
      <div key={index} className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {item.title}
        </h4>
        
        {item.text && (
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            {item.text}
          </p>
        )}
        
        {item.items && (
          <ul className="space-y-2">
            {item.items.map((listItem, listIndex) => (
              <li key={listIndex} className="flex items-start space-x-3">
                <span className="text-green-500 dark:text-green-400 mt-1">•</span>
                <span className="text-gray-700 dark:text-gray-300">{listItem}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    ));
  };

  const GuidelinesContent = () => (
    <div className={`${compact ? 'max-h-96 overflow-y-auto' : ''}`}>
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {sectionKeys.map((key) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              activeSection === key
                ? 'border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="mr-2">{guidelines[key].icon}</span>
            {guidelines[key].title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <span className="text-3xl">{guidelines[activeSection].icon}</span>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {guidelines[activeSection].title}
          </h3>
        </div>
        
        {renderContent(guidelines[activeSection].content)}
      </div>

      {/* Quick Tips */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start space-x-3">
          <span className="text-blue-500 text-xl">💡</span>
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
              Quick Tips for a Great Community Experience
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• Be kind and welcoming to new players</li>
              <li>• Share your knowledge and learn from others</li>
              <li>• Use the report system to help maintain community standards</li>
              <li>• Celebrate good plays and sportsmanship</li>
              <li>• Remember that everyone started as a beginner</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          Need Help or Have Questions?
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p>• Use the report system for community violations</p>
          <p>• Contact moderators for urgent issues</p>
          <p>• Check our FAQ section for common questions</p>
          <p>• Join our Discord for real-time community support</p>
        </div>
      </div>
    </div>
  );

  // Modal version
  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Community Guidelines
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <GuidelinesContent />
          </div>
        </div>
      </div>
    );
  }

  // Regular page version
  return (
    <div className="max-w-4xl mx-auto p-6">
      {showTitle && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Community Guidelines
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Building a positive and inclusive Marvel Rivals community together
          </p>
        </div>
      )}
      
      <GuidelinesContent />
    </div>
  );
};

export default CommunityGuidelines;