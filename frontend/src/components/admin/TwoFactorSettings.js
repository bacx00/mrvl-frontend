import React, { useState, useEffect } from 'react';

function TwoFactorSettings({ user, api }) {
  const [twoFactorStatus, setTwoFactorStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disabling, setDisabling] = useState(false);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/2fa/status');
      setTwoFactorStatus(response.data || response);
    } catch (err) {
      console.error('Failed to fetch 2FA status:', err);
      setError('Failed to load 2FA status');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!code.trim()) {
      setError('Please enter your 2FA code or recovery code');
      return;
    }

    try {
      setDisabling(true);
      setError('');
      setMessage('');

      const response = await api.post('/2fa/disable', { code });
      
      if (response.success) {
        setMessage('Two-factor authentication has been disabled successfully');
        setTwoFactorStatus({ ...twoFactorStatus, enabled: false });
        setCode('');
      } else {
        setError(response.message || 'Failed to disable 2FA');
      }
    } catch (err) {
      console.error('Failed to disable 2FA:', err);
      setError(err.response?.data?.message || 'Failed to disable 2FA. Please check your code.');
    } finally {
      setDisabling(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 2FA Status */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            Two-Factor Authentication Status
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {twoFactorStatus?.enabled 
              ? 'Your account is protected with 2FA' 
              : '2FA is not enabled for your account'}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          twoFactorStatus?.enabled 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
        }`}>
          {twoFactorStatus?.enabled ? 'Enabled' : 'Disabled'}
        </div>
      </div>

      {/* Disable 2FA Section */}
      {twoFactorStatus?.enabled && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h5 className="font-medium text-yellow-800 dark:text-yellow-400 mb-3">
            Disable Two-Factor Authentication
          </h5>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
            Warning: Disabling 2FA will make your admin account less secure. Enter your current 2FA code or a recovery code to confirm.
          </p>

          {message && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
              <p className="text-sm text-green-700 dark:text-green-300">{message}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError('');
              }}
              placeholder="Enter 2FA or recovery code"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              disabled={disabling}
            />
            <button
              onClick={handleDisable2FA}
              disabled={disabling || !code.trim()}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {disabling ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        </div>
      )}

      {/* Enable 2FA Section */}
      {!twoFactorStatus?.enabled && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h5 className="font-medium text-blue-800 dark:text-blue-400 mb-3">
            Enable Two-Factor Authentication
          </h5>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
            To enable 2FA, you'll need to use an authenticator app like Google Authenticator or Authy.
          </p>
          <button
            onClick={() => {
              // This would typically open a modal or redirect to 2FA setup
              window.alert('2FA setup would open here. This feature will be implemented with the proper QR code scanning flow.');
            }}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Setup 2FA
          </button>
        </div>
      )}

      {/* Recovery Codes Info */}
      {twoFactorStatus?.enabled && twoFactorStatus?.recovery_codes_count !== undefined && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong className="text-gray-900 dark:text-white">Recovery codes remaining:</strong> {twoFactorStatus.recovery_codes_count}
          </p>
          {twoFactorStatus.recovery_codes_count < 3 && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
              Warning: You have few recovery codes left. Consider regenerating them.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default TwoFactorSettings;