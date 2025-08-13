import React, { useState } from 'react';
import { useAuth } from '../../hooks';

const ReportButton = ({ 
  targetType, 
  targetId, 
  targetUserId, 
  className = "",
  size = "sm",
  variant = "secondary",
  showText = false,
  onReport = null 
}) => {
  const { api, user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    reason: '',
    category: 'spam',
    description: '',
    severity: 'medium',
    anonymous: false
  });

  const reportCategories = [
    { value: 'spam', label: 'Spam or Advertisement', icon: '📧' },
    { value: 'harassment', label: 'Harassment or Bullying', icon: '😡' },
    { value: 'hate_speech', label: 'Hate Speech', icon: '🚫' },
    { value: 'inappropriate', label: 'Inappropriate Content', icon: '⚠️' },
    { value: 'misinformation', label: 'False Information', icon: '❌' },
    { value: 'doxxing', label: 'Personal Information Sharing', icon: '🔒' },
    { value: 'cheating', label: 'Cheating or Exploiting', icon: '🎮' },
    { value: 'copyright', label: 'Copyright Violation', icon: '©️' },
    { value: 'other', label: 'Other Violation', icon: '❓' }
  ];

  const severityLevels = [
    { value: 'low', label: 'Low Priority', color: 'text-green-600', description: 'Minor issue that can wait' },
    { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600', description: 'Needs attention soon' },
    { value: 'high', label: 'High Priority', color: 'text-orange-600', description: 'Urgent review needed' },
    { value: 'critical', label: 'Critical', color: 'text-red-600', description: 'Immediate action required' }
  ];

  const handleSubmitReport = async () => {
    if (!user) {
      alert('You must be logged in to report content');
      return;
    }

    if (!reportData.reason.trim()) {
      alert('Please provide a reason for your report');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/reports', {
        reportable_type: targetType,
        reportable_id: targetId,
        reported_user_id: targetUserId,
        category: reportData.category,
        reason: reportData.reason,
        description: reportData.description,
        severity: reportData.severity,
        anonymous: reportData.anonymous,
        reporter_ip: null, // Backend will handle this
        user_agent: navigator.userAgent
      });

      if (response.data.success) {
        setShowModal(false);
        setReportData({
          reason: '',
          category: 'spam',
          description: '',
          severity: 'medium',
          anonymous: false
        });
        
        if (onReport) {
          onReport(response.data.data);
        }
        
        // Show success message
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <div class="text-center">
              <div class="text-green-500 text-4xl mb-4">✅</div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Report Submitted</h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4">
                Thank you for helping keep our community safe. We'll review your report shortly.
              </p>
              <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                Close
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        setTimeout(() => modal.remove(), 5000);
        
      } else {
        throw new Error(response.data.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert(error.response?.data?.message || error.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getButtonClasses = () => {
    const baseClasses = "inline-flex items-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    const sizeClasses = {
      xs: "px-2 py-1 text-xs",
      sm: "px-3 py-1.5 text-sm", 
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base"
    };

    const variantClasses = {
      primary: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
      secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 focus:ring-gray-500",
      outline: "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-gray-500",
      ghost: "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
    };

    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  };

  const selectedCategory = reportCategories.find(cat => cat.value === reportData.category);
  const selectedSeverity = severityLevels.find(sev => sev.value === reportData.severity);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={getButtonClasses()}
        title="Report this content"
      >
        <span className="text-base mr-1">🚩</span>
        {showText && <span>Report</span>}
      </button>

      {/* Report Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Report Content
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Help us maintain a safe and respectful community by reporting inappropriate content.
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Report Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  What's wrong with this content? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {reportCategories.map((category) => (
                    <label
                      key={category.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                        reportData.category === category.value
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-500'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={category.value}
                        checked={reportData.category === category.value}
                        onChange={(e) => setReportData({ ...reportData, category: e.target.value })}
                        className="sr-only"
                      />
                      <span className="text-lg mr-3">{category.icon}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {category.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Severity Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  How urgent is this issue? *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {severityLevels.map((severity) => (
                    <label
                      key={severity.value}
                      className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all ${
                        reportData.severity === severity.value
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-500'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="severity"
                        value={severity.value}
                        checked={reportData.severity === severity.value}
                        onChange={(e) => setReportData({ ...reportData, severity: e.target.value })}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className={`font-medium ${severity.color}`}>
                          {severity.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {severity.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Please explain why you're reporting this content *
                </label>
                <textarea
                  value={reportData.reason}
                  onChange={(e) => setReportData({ ...reportData, reason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Describe the specific issue you're reporting..."
                  required
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {reportData.reason.length}/500 characters
                </div>
              </div>

              {/* Additional Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={reportData.description}
                  onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Any additional context that might help our moderators..."
                />
              </div>

              {/* Anonymous Option */}
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={reportData.anonymous}
                    onChange={(e) => setReportData({ ...reportData, anonymous: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Submit anonymously
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Your username won't be visible to other users (moderators can still see it)
                    </div>
                  </div>
                </label>
              </div>

              {/* Report Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Report Summary:</h4>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div>Category: <span className="font-medium">{selectedCategory?.icon} {selectedCategory?.label}</span></div>
                  <div>Priority: <span className={`font-medium ${selectedSeverity?.color}`}>{selectedSeverity?.label}</span></div>
                  <div>Anonymous: <span className="font-medium">{reportData.anonymous ? 'Yes' : 'No'}</span></div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={loading || !reportData.reason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportButton;