import React, { useState } from 'react';

function CareersPage() {
  const [selectedRole, setSelectedRole] = useState(null);

  const openPositions = [
    {
      id: 1,
      title: 'Senior Full-Stack Developer',
      department: 'Engineering',
      location: 'San Francisco, CA / Remote',
      type: 'Full-time',
      experience: '5+ years',
      description: 'Lead the development of scalable web applications for our esports platform. Work with React, Node.js, and modern cloud infrastructure.',
      requirements: [
        'Expert knowledge in React, TypeScript, and Node.js',
        'Experience with cloud platforms (AWS, GCP, or Azure)',
        'Strong understanding of database design and optimization',
        'Experience with real-time applications and WebSocket',
        'Knowledge of esports or gaming industry preferred'
      ],
      responsibilities: [
        'Architect and develop high-performance web applications',
        'Mentor junior developers and lead technical decisions',
        'Collaborate with product team on feature development',
        'Ensure code quality and implement best practices',
        'Optimize application performance and scalability'
      ]
    },
    {
      id: 2,
      title: 'Data Scientist - Esports Analytics',
      department: 'Data & Analytics',
      location: 'Los Angeles, CA / Remote',
      type: 'Full-time',
      experience: '3+ years',
      description: 'Build advanced analytics and machine learning models to provide insights into Marvel Rivals competitive gameplay and player performance.',
      requirements: [
        'PhD or Masters in Data Science, Statistics, or related field',
        'Strong Python skills with ML libraries (pandas, scikit-learn, PyTorch)',
        'Experience with statistical analysis and data visualization',
        'Knowledge of gaming or esports data preferred',
        'Experience with large-scale data processing'
      ],
      responsibilities: [
        'Develop predictive models for player and team performance',
        'Create automated reporting and analytics dashboards',
        'Analyze gameplay patterns and meta trends',
        'Collaborate with product team on data-driven features',
        'Present insights to stakeholders and community'
      ]
    },
    {
      id: 3,
      title: 'Community Manager',
      department: 'Community & Marketing',
      location: 'Remote',
      type: 'Full-time',
      experience: '2+ years',
      description: 'Build and nurture our growing Marvel Rivals community across multiple platforms. Engage with players, content creators, and tournament organizers.',
      requirements: [
        'Proven experience in community management for gaming/esports',
        'Excellent written and verbal communication skills',
        'Deep knowledge of Marvel Rivals and competitive gaming',
        'Experience with social media management and content creation',
        'Passion for fostering positive community environments'
      ],
      responsibilities: [
        'Manage community across Discord, forums, and social media',
        'Organize community events and tournaments',
        'Create engaging content and newsletters',
        'Moderate discussions and enforce community guidelines',
        'Gather feedback and represent community voice to product team'
      ]
    },
    {
      id: 4,
      title: 'DevOps Engineer',
      department: 'Engineering',
      location: 'San Francisco, CA / Remote',
      type: 'Full-time',
      experience: '4+ years',
      description: 'Maintain and scale our cloud infrastructure to support millions of users and real-time esports data processing.',
      requirements: [
        'Strong experience with Kubernetes and Docker',
        'Proficiency with cloud platforms (AWS preferred)',
        'Experience with CI/CD pipelines and automation',
        'Knowledge of monitoring and observability tools',
        'Understanding of security best practices'
      ],
      responsibilities: [
        'Manage and optimize cloud infrastructure',
        'Implement CI/CD pipelines for rapid deployment',
        'Monitor system performance and reliability',
        'Ensure security and compliance standards',
        'Automate operational processes and workflows'
      ]
    },
    {
      id: 5,
      title: 'UX/UI Designer',
      department: 'Design',
      location: 'Los Angeles, CA / Remote',
      type: 'Full-time',
      experience: '3+ years',
      description: 'Design intuitive and engaging user experiences for our esports platform, from mobile interfaces to complex data visualizations.',
      requirements: [
        'Strong portfolio demonstrating UX/UI design skills',
        'Proficiency with Figma, Sketch, or similar design tools',
        'Experience designing for web and mobile applications',
        'Understanding of accessibility and usability principles',
        'Interest in gaming and esports preferred'
      ],
      responsibilities: [
        'Design user-centered interfaces for web and mobile',
        'Create wireframes, prototypes, and design systems',
        'Conduct user research and usability testing',
        'Collaborate with engineers on implementation',
        'Ensure consistent brand experience across platforms'
      ]
    },
    {
      id: 6,
      title: 'Content Creator & Analyst',
      department: 'Content',
      location: 'Remote',
      type: 'Contract',
      experience: '1+ years',
      description: 'Create engaging content about Marvel Rivals esports including match analysis, player spotlights, and meta discussions.',
      requirements: [
        'Deep knowledge of Marvel Rivals competitive scene',
        'Strong writing skills and ability to explain complex topics',
        'Experience creating content for gaming/esports audience',
        'Video editing and graphic design skills preferred',
        'Understanding of social media and content distribution'
      ],
      responsibilities: [
        'Write match recaps and analysis articles',
        'Create player and team spotlight content',
        'Produce educational content about game mechanics',
        'Manage content calendar and publication schedule',
        'Engage with community through content and social media'
      ]
    }
  ];

  const benefits = [
    {
      icon: '💰',
      title: 'Competitive Salary',
      description: 'Industry-leading compensation with equity options and performance bonuses.'
    },
    {
      icon: '🏥',
      title: 'Health & Wellness',
      description: 'Comprehensive health, dental, and vision insurance plus wellness stipend.'
    },
    {
      icon: '🏖️',
      title: 'Flexible PTO',
      description: 'Unlimited paid time off policy to maintain work-life balance.'
    },
    {
      icon: '💻',
      title: 'Remote First',
      description: 'Work from anywhere with flexible hours and modern equipment provided.'
    },
    {
      icon: '📚',
      title: 'Learning Budget',
      description: '$2,000 annual budget for conferences, courses, and professional development.'
    },
    {
      icon: '🎮',
      title: 'Gaming Perks',
      description: 'Gaming setup allowance, tournament tickets, and exclusive esports events access.'
    }
  ];

  const values = [
    {
      title: 'Community First',
      description: 'Everything we build serves the Marvel Rivals community. We listen, engage, and create value for players and fans.',
      icon: '🤝'
    },
    {
      title: 'Data-Driven Excellence',
      description: 'We make decisions based on data and user feedback, constantly iterating to improve our platform.',
      icon: '📊'
    },
    {
      title: 'Inclusive Innovation',
      description: 'We believe diverse perspectives lead to better products. We foster an inclusive environment where everyone can thrive.',
      icon: '🌟'
    },
    {
      title: 'Passion for Esports',
      description: 'We genuinely love competitive gaming and esports. This passion drives us to create the best possible experience.',
      icon: '🏆'
    }
  ];

  return (
    <div className="animate-fade-in space-y-12">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-heading-1 gradient-text mb-6">Join Our Team</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
          Help us build the future of Marvel Rivals esports. We're looking for passionate individuals 
          who want to create amazing experiences for the competitive gaming community.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => document.getElementById('open-positions').scrollIntoView({ behavior: 'smooth' })}
            className="btn btn-primary"
          >
            View Open Positions
          </button>
          <button className="btn btn-secondary">
            Learn About Our Culture
          </button>
        </div>
      </div>

      {/* Company Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">50+</div>
          <div className="text-gray-600 dark:text-gray-400">Team Members</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">500K+</div>
          <div className="text-gray-600 dark:text-gray-400">Active Users</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">$15M</div>
          <div className="text-gray-600 dark:text-gray-400">Series A Funding</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">98%</div>
          <div className="text-gray-600 dark:text-gray-400">Employee Satisfaction</div>
        </div>
      </div>

      {/* Our Values */}
      <div>
        <h2 className="text-heading-2 text-center mb-8">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <div key={index} className="card p-6 text-center">
              <div className="text-4xl mb-4">{value.icon}</div>
              <h3 className="text-heading-3 mb-3">{value.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div>
        <h2 className="text-heading-2 text-center mb-8">Why Work With Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="card p-6">
              <div className="flex items-start space-x-4">
                <div className="text-3xl">{benefit.icon}</div>
                <div>
                  <h3 className="text-heading-3 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Open Positions */}
      <div id="open-positions">
        <h2 className="text-heading-2 text-center mb-8">Open Positions</h2>
        <div className="space-y-6">
          {openPositions.map((position) => (
            <div key={position.id} className="card">
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => setSelectedRole(selectedRole === position.id ? null : position.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="text-heading-3">{position.title}</h3>
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                        {position.type}
                      </span>
                    </div>
                    <div className="flex items-center space-x-6 text-gray-600 dark:text-gray-400 text-sm mb-3">
                      <span>🏢 {position.department}</span>
                      <span>📍 {position.location}</span>
                      <span>⭐ {position.experience}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {position.description}
                    </p>
                  </div>
                  <span className="text-2xl ml-4">
                    {selectedRole === position.id ? '−' : '+'}
                  </span>
                </div>
              </div>

              {selectedRole === position.id && (
                <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Requirements
                      </h4>
                      <ul className="space-y-2">
                        {position.requirements.map((req, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                            <span className="text-gray-600 dark:text-gray-400 text-sm">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Responsibilities
                      </h4>
                      <ul className="space-y-2">
                        {position.responsibilities.map((resp, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                            <span className="text-gray-600 dark:text-gray-400 text-sm">{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <button className="btn btn-primary">
                      Apply for This Position
                    </button>
                    <button className="btn btn-secondary">
                      Share with a Friend
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Application Process */}
      <div>
        <h2 className="text-heading-2 text-center mb-8">Our Hiring Process</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-heading-3 mb-2">Apply</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Submit your application with resume and cover letter. We review all applications carefully.
            </p>
          </div>
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-heading-3 mb-2">Screen</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Initial phone/video call to discuss your background and interest in the role.
            </p>
          </div>
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-heading-3 mb-2">Interview</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Technical and cultural fit interviews with team members and hiring manager.
            </p>
          </div>
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              4
            </div>
            <h3 className="text-heading-3 mb-2">Offer</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Reference checks, offer discussion, and welcome to the MRVL family!
            </p>
          </div>
        </div>
      </div>

      {/* Company Culture */}
      <div className="card p-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-heading-2 mb-6">Life at MRVL</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We're building more than just a platform - we're creating a community of passionate 
            gamers and technologists who believe in the power of esports to bring people together. 
            Our team works hard, celebrates success, and supports each other through challenges.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl mb-2">🎮</div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Gaming Culture</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Weekly gaming sessions, tournament viewing parties, and esports event attendance.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">🌱</div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Growth Mindset</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Continuous learning, mentorship programs, and career development opportunities.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">🌍</div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Global Impact</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Work with a global team serving the worldwide Marvel Rivals community.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="card p-8 text-center">
        <h2 className="text-heading-2 mb-4">Don't See the Right Role?</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
          We're always interested in hearing from talented individuals who are passionate about 
          esports and technology. Send us your resume and tell us how you'd like to contribute.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="btn btn-primary">
            Send Us Your Resume
          </button>
          <button className="btn btn-secondary">
            Join Our Talent Network
          </button>
        </div>
        <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
          <p>Questions about careers? Reach out to <strong>careers@mrvl.gg</strong></p>
        </div>
      </div>
    </div>
  );
}

export default CareersPage;
