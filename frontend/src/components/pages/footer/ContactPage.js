import React, { useState } from 'react';

function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        category: 'general',
        message: ''
      });
    }, 1000);
  };

  const contactMethods = [
    {
      icon: '📧',
      title: 'General Inquiries',
      detail: 'support@mrvl.gg',
      description: 'For general questions and support'
    },
    {
      icon: '🤝',
      title: 'Business & Partnerships',
      detail: 'jhonny@ar-mediia.com',
      description: 'For partnership opportunities and business inquiries'
    },
    {
      icon: '🐛',
      title: 'Bug Reports',
      detail: 'bugs@mrvl.gg',
      description: 'Report technical issues and bugs'
    },
    {
      icon: '🎮',
      title: 'Community',
      detail: 'Discord Server',
      description: 'Join our community for live discussions',
      link: 'https://discord.gg/mrvl'
    }
  ];

  const officeLocations = [
    {
      title: 'Headquarters',
      address: '123 Esports Avenue',
      city: 'Los Angeles, CA 90210',
      country: 'United States',
      flag: '🇺🇸'
    },
    {
      title: 'Development Office',
      address: '456 Tech District',
      city: 'San Francisco, CA 94105',
      country: 'United States',
      flag: '🇺🇸'
    }
  ];

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'business', label: 'Business & Partnerships' },
    { value: 'feedback', label: 'Feedback & Suggestions' },
    { value: 'press', label: 'Press & Media' },
    { value: 'careers', label: 'Careers' }
  ];

  const faqs = [
    {
      question: 'How do I report incorrect match data?',
      answer: 'Use our bug report form or email bugs@mrvl.gg with specific details about the incorrect data, including match ID and what should be corrected.'
    },
    {
      question: 'Can I get my team added to the platform?',
      answer: 'Teams are automatically added when they participate in tracked tournaments. For manual additions, contact us with your team\'s competitive history.'
    },
    {
      question: 'Do you have an API for developers?',
      answer: 'We\'re currently developing a public API. Join our Discord or subscribe to our newsletter for updates on the release.'
    },
    {
      question: 'How can I become a partner?',
      answer: 'Contact our business team at jhonny@ar-mediia.com with details about your organization and partnership proposal.'
    }
  ];

  return (
    <div className="animate-fade-in space-y-12">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-heading-1 gradient-text mb-6">Contact Us</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
          We're here to help! Whether you have questions, feedback, or need support, 
          our team is ready to assist you.
        </p>
      </div>

      {/* Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {contactMethods.map((method, index) => (
          <div key={index} className="card p-6 text-center">
            <div className="text-4xl mb-4">{method.icon}</div>
            <h3 className="text-heading-3 mb-2">{method.title}</h3>
            <div className="text-blue-600 dark:text-blue-400 font-medium mb-2">
              {method.link ? (
                <a href={method.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {method.detail}
                </a>
              ) : (
                method.detail
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {method.description}
            </p>
          </div>
        ))}
      </div>

      {/* Contact Form and Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="card p-8">
            <h2 className="text-heading-2 mb-6">Send us a Message</h2>
            
            {success && (
              <div className="alert alert-success mb-6">
                <strong>Message sent successfully!</strong> We'll get back to you within 24 hours.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Brief subject line"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={6}
                  className="form-input"
                  placeholder="Tell us how we can help you..."
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner mr-2"></div>
                    Sending Message...
                  </>
                ) : (
                  'Send Message'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-8">
          {/* Office Locations */}
          <div className="card p-6">
            <h3 className="text-heading-3 mb-4">Our Offices</h3>
            <div className="space-y-4">
              {officeLocations.map((office, index) => (
                <div key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-4 last:pb-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{office.flag}</span>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {office.title}
                    </h4>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">
                    <div>{office.address}</div>
                    <div>{office.city}</div>
                    <div>{office.country}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Response Time */}
          <div className="card p-6">
            <h3 className="text-heading-3 mb-4">Response Times</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">General Inquiries</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">24 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Technical Support</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">12 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Business Inquiries</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">48 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Press Requests</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">24 hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div>
        <h2 className="text-heading-2 text-center mb-8">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqs.map((faq, index) => (
            <div key={index} className="card p-6">
              <h3 className="text-heading-3 mb-3">{faq.question}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="card p-8 text-center bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
        <div className="text-4xl mb-4">🚨</div>
        <h2 className="text-heading-2 mb-4 text-red-800 dark:text-red-200">Emergency Contact</h2>
        <p className="text-red-700 dark:text-red-300 mb-4">
          For urgent security issues, platform abuse, or critical bugs affecting live tournaments:
        </p>
        <div className="font-bold text-red-800 dark:text-red-200">
          emergency@mrvl.gg
        </div>
        <p className="text-sm text-red-600 dark:text-red-400 mt-2">
          Emergency contacts are monitored 24/7 during major tournaments
        </p>
      </div>
    </div>
  );
}

export default ContactPage;
