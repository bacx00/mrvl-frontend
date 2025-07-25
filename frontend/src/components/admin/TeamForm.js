import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { useMentionAutocomplete } from '../../hooks/useMentionAutocomplete';
import { API_CONFIG } from '../../config';
import ImageUpload from '../shared/ImageUpload';
import MentionDropdown from '../shared/MentionDropdown';

function TeamForm({ teamId, navigateTo }) {
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    region: '',
    logo: '',
    flag: '',
    country: '',
    rating: 1000, // Team ELO rating with Marvel Rivals default
    earnings: 0, // Team total earnings
    coachPicture: '',
    socialLinks: {
      twitter: '',
      instagram: '',
      youtube: '',
      website: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [flagFile, setFlagFile] = useState(null);
  const [coachFile, setCoachFile] = useState(null);
  const [error, setError] = useState(null);
  const { api } = useAuth();


  const isEdit = Boolean(teamId);

  const fetchTeam = async () => {
    if (!isEdit) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/teams/${teamId}`);
      const team = response.data || response;
      
      console.log('TeamForm - Fetched team data:', team);
      
      setFormData({
        name: team.name || '',
        shortName: team.short_name || team.shortName || '',
        region: team.region || '',
        logo: team.logo_url || team.logo || '',
        flag: team.flag_url || team.flag || '',
        country: team.country || '',
        rating: team.rating || 1000, // Load ELO rating from backend
        earnings: team.earnings || team.total_earnings || 0, // Load team earnings
        coachPicture: team.coach_picture_url || team.coach_picture || '',
        socialLinks: team.social_links || team.socialLinks || {
          twitter: '',
          instagram: '',
          youtube: '',
          website: ''
        }
      });
    } catch (error) {
      console.error('Error fetching team:', error);
      setError('Error loading team data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [teamId, isEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('social_')) {
      const socialKey = name.replace('social_', '');
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };


  const handleNumberInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const handleLogoSelect = (file, previewUrl) => {
    console.log('TeamForm - Logo selected:', file?.name, previewUrl);
    setLogoFile(file);
    setFormData(prev => ({
      ...prev,
      logo: previewUrl || ''
    }));
  };

  const handleFlagSelect = (file, previewUrl) => {
    console.log('TeamForm - Flag selected:', file?.name, previewUrl);
    setFlagFile(file);
    setFormData(prev => ({
      ...prev,
      flag: previewUrl || ''
    }));
  };

  const handleCoachSelect = (file, previewUrl) => {
    console.log('TeamForm - Coach picture selected:', file?.name, previewUrl);
    setCoachFile(file);
    setFormData(prev => ({
      ...prev,
      coachPicture: previewUrl || ''
    }));
  };

  const uploadImage = async (file, teamId, type) => {
    if (!file) return null;
    
    try {
      console.log(`TeamForm - Uploading ${type} for team ${teamId}:`, file.name);
      
      const uploadFormData = new FormData();
      // CRITICAL FIX: Use correct field names based on backend documentation
      if (type === 'logo') {
        uploadFormData.append('logo', file); // Backend expects 'logo' field
      } else if (type === 'flag') {
        uploadFormData.append('flag', file); // Backend expects 'flag' field
      } else if (type === 'coach') {
        uploadFormData.append('coach_picture', file); // Backend expects 'coach_picture' field
      }
      
      const endpoint = type === 'logo' 
        ? `/upload/team/${teamId}/logo`
        : type === 'flag'
        ? `/upload/team/${teamId}/flag`
        : `/upload/team/${teamId}/coach`;
      
      console.log(`TeamForm - Upload endpoint: ${endpoint}`);
      
      const response = await api.postFile(endpoint, uploadFormData);
      
      console.log(`TeamForm - ${type} upload response:`, response);
      
      // CRITICAL FIX: Extract URL based on backend documentation
      const data = response.data || response;
      
      // Backend returns: {"success": true, "message": "...", "data": {"logo": "path", "logo_url": "full_url"}}
      let imageUrl;
      if (data.data) {
        imageUrl = data.data.logo_url || data.data.flag_url || data.data.coach_picture_url || data.data.logo || data.data.flag || data.data.coach_picture;
      } else {
        imageUrl = data.logo_url || data.flag_url || data.coach_picture_url || data.url || data.logo || data.flag || data.coach_picture;
      }
      
      console.log(`TeamForm - Extracted ${type} URL:`, imageUrl);
      
      if (!imageUrl) {
        console.error(`TeamForm - No ${type} URL found in response:`, data);
        throw new Error(`No ${type} URL returned from upload`);
      }
      
      return imageUrl;
    } catch (error) {
      console.error(`TeamForm - Error uploading ${type}:`, error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Team name is required');
      return;
    }
    
    if (!formData.shortName.trim()) {
      setError('Short name is required');
      return;
    }
    
    if (!formData.region) {
      setError('Region is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      console.log('TeamForm - Starting save process...');
      
      // CRITICAL FIX: Prepare proper data format for Laravel backend
      const submitData = {
        name: formData.name.trim(),
        short_name: formData.shortName.trim(),
        region: formData.region,
        country: formData.country,
        rating: parseInt(formData.rating) || 1000, // Include ELO rating
        earnings: parseFloat(formData.earnings) || 0, // Include team earnings
        // CRITICAL FIX: Ensure social_links is properly formatted
        social_links: {
          twitter: formData.socialLinks.twitter || '',
          instagram: formData.socialLinks.instagram || '',
          youtube: formData.socialLinks.youtube || '',
          website: formData.socialLinks.website || ''
        }
      };

      console.log('TeamForm - Submit data prepared:', submitData);

      let teamIdForUpload = teamId;
      
      // If creating new team, save team first to get ID
      if (!isEdit) {
        console.log('Creating new team first to get ID...');
        const response = await api.post('/admin/teams', submitData);
        const savedTeam = response.data || response;
        teamIdForUpload = savedTeam.id;
        console.log('New team created with ID:', teamIdForUpload);
      } else {
        // Update existing team
        console.log('Updating existing team with ID:', teamId);
        await api.put(`/admin/teams/${teamId}`, submitData);
        console.log('Team updated successfully');
      }

      // CRITICAL FIX: Upload images AFTER team creation/update (fresh CSRF token)
      let logoUrl = formData.logo;
      let flagUrl = formData.flag;
      let coachPictureUrl = formData.coachPicture;
      
      try {
        if (logoFile) {
          console.log('TeamForm - Uploading logo...');
          logoUrl = await uploadImage(logoFile, teamIdForUpload, 'logo');
          if (logoUrl) {
            console.log('TeamForm - Logo uploaded successfully:', logoUrl);
          }
        }

        if (flagFile) {
          console.log('TeamForm - Uploading flag...');
          flagUrl = await uploadImage(flagFile, teamIdForUpload, 'flag');
          if (flagUrl) {
            console.log('TeamForm - Flag uploaded successfully:', flagUrl);
          }
        }

        if (coachFile) {
          console.log('TeamForm - Uploading coach picture...');
          coachPictureUrl = await uploadImage(coachFile, teamIdForUpload, 'coach');
          if (coachPictureUrl) {
            console.log('TeamForm - Coach picture uploaded successfully:', coachPictureUrl);
          }
        }
      } catch (uploadError) {
        console.error('TeamForm - Image upload failed:', uploadError);
        alert('Team saved but image upload failed: ' + uploadError.message);
      }

      // Final update with image URLs if they were uploaded
      if ((logoFile && logoUrl) || (flagFile && flagUrl) || (coachFile && coachPictureUrl)) {
        console.log('TeamForm - Updating team with image URLs...');
        const finalUpdateData = {
          ...submitData,
          // Include uploaded image paths
          logo: logoUrl && logoUrl.includes('storage/') ? logoUrl.replace(`${API_CONFIG.BASE_URL}/storage/`, '') : logoUrl,
          flag: flagUrl && flagUrl.includes('storage/') ? flagUrl.replace(`${API_CONFIG.BASE_URL}/storage/`, '') : flagUrl,
          coach_picture: coachPictureUrl && coachPictureUrl.includes('storage/') ? coachPictureUrl.replace(`${API_CONFIG.BASE_URL}/storage/`, '') : coachPictureUrl,
          earnings: parseFloat(formData.earnings) || 0 // Ensure earnings is included in final update
        };

        await api.put(`/admin/teams/${teamIdForUpload}`, finalUpdateData);
        console.log('TeamForm - Team updated with images');
      }

      // Update form data with final URLs
      setFormData(prev => ({
        ...prev,
        logo: logoUrl,
        flag: flagUrl,
        coachPicture: coachPictureUrl
      }));

      alert(`Team ${isEdit ? 'updated' : 'created'} successfully!`);
      
      // Delay navigation to let user see the success
      setTimeout(() => {
        if (navigateTo) {
          navigateTo('admin-dashboard');
        }
      }, 1500);
      
    } catch (error) {
      console.error('TeamForm - Error saving team:', error);
      
      // Enhanced error handling for backend issues
      if (error.message.includes('500')) {
        setError('BACKEND ISSUE: Server error. Please check backend team validation and database constraints.');
      } else if (error.message.includes('422')) {
        if (error.message.includes('name') && error.message.includes('unique')) {
          setError('BACKEND ISSUE: Team name already exists. Check unique constraints.');
        } else if (error.message.includes('social_links')) {
          setError('BACKEND ISSUE: Social links validation failed. Check backend social_links field format.');
        } else {
          setError('BACKEND ISSUE: Validation error. Check backend validation rules for team fields.');
        }
      } else if (error.message.includes('404')) {
        setError('BACKEND ISSUE: Team API endpoint not found. Implement /api/admin/teams routes.');
      } else {
        setError(`Failed to save team: ${error.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading team data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Team' : 'Create New Team'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isEdit ? 'Update team information and social links' : 'Add a new team to the database'}
          </p>
        </div>
        <button 
          onClick={() => navigateTo && navigateTo('admin-dashboard')}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Display with Backend Issue Highlighting */}
        {error && (
          <div className={`border px-4 py-3 rounded mb-4 ${
            error.includes('BACKEND ISSUE') 
              ? 'bg-red-100 border-red-400 text-red-700' 
              : 'bg-yellow-100 border-yellow-400 text-yellow-700'
          }`}>
            {error}
            {error.includes('BACKEND ISSUE') && (
              <div className="mt-2 text-sm">
                <strong>For Backend Developer:</strong> Please check Laravel team model validation and API routes.
              </div>
            )}
          </div>
        )}

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Team Logo
              </label>
              <ImageUpload
                onImageSelect={handleLogoSelect}
                currentImage={formData.logo}
                placeholder="Upload Team Logo"
                className="w-full max-w-md"
              />
              {formData.logo && (
                <div className="mt-2">
                  <img 
                    src={formData.logo} 
                    alt="Current logo" 
                    className="w-16 h-16 object-cover rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Team Flag */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Team Flag/Banner
              </label>
              <ImageUpload
                onImageSelect={handleFlagSelect}
                currentImage={formData.flag}
                placeholder="Upload Team Flag"
                className="w-full max-w-md"
              />
              {formData.flag && (
                <div className="mt-2">
                  <img 
                    src={formData.flag} 
                    alt="Current flag" 
                    className="w-16 h-16 object-cover rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Coach Picture */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Coach Picture
              </label>
              <ImageUpload
                onImageSelect={handleCoachSelect}
                currentImage={formData.coachPicture}
                placeholder="Upload Coach Picture"
                className="w-full max-w-md"
              />
              {formData.coachPicture && (
                <div className="mt-2">
                  <img 
                    src={formData.coachPicture} 
                    alt="Current coach" 
                    className="w-16 h-16 object-cover rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Optional: Picture of the team's coach
              </p>
            </div>

            {/* Team Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Team Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., Team Stark Industries"
                required
              />
            </div>

            {/* Short Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Short Name *
              </label>
              <input
                type="text"
                name="shortName"
                value={formData.shortName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., STARK"
                maxLength="8"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum 8 characters
              </p>
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Region *
              </label>
              <select
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                className="form-input"
                required
              >
                <option value="">Select Region</option>
                <option value="NA">North America</option>
                <option value="EU">Europe</option>
                <option value="APAC">Asia-Pacific</option>
                <option value="SA">South America</option>
                <option value="MENA">Middle East & North Africa</option>
                <option value="OCE">Oceania</option>
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., United States"
              />
            </div>

            {/* ELO Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                ELO Rating
              </label>
              <input
                type="number"
                name="rating"
                value={formData.rating}
                onChange={handleNumberInputChange}
                className="form-input"
                placeholder="1000"
                min="0"
                max="5000"
                step="1"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Team ELO rating (0-5000). Default: 1000
              </p>
            </div>

            {/* Total Earnings */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Total Earnings ($)
              </label>
              <input
                type="number"
                name="earnings"
                value={formData.earnings}
                onChange={handleNumberInputChange}
                className="form-input"
                placeholder="0"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Team's total tournament earnings in USD
              </p>
            </div>

          </div>
        </div>

        {/* Social Links - CRITICAL FIX */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Social Links</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Twitter
              </label>
              <input
                type="url"
                name="social_twitter"
                value={formData.socialLinks.twitter}
                onChange={handleInputChange}
                className="form-input"
                placeholder="https://twitter.com/teamname"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Full Twitter URL
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Instagram
              </label>
              <input
                type="url"
                name="social_instagram"
                value={formData.socialLinks.instagram}
                onChange={handleInputChange}
                className="form-input"
                placeholder="https://instagram.com/teamname"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Full Instagram URL
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                YouTube
              </label>
              <input
                type="url"
                name="social_youtube"
                value={formData.socialLinks.youtube}
                onChange={handleInputChange}
                className="form-input"
                placeholder="https://youtube.com/c/teamname"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Full YouTube URL
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Website
              </label>
              <input
                type="url"
                name="social_website"
                value={formData.socialLinks.website}
                onChange={handleInputChange}
                className="form-input"
                placeholder="https://teamname.com"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Official team website
              </p>
            </div>
          </div>

          {/* Social Links Preview */}
          {(formData.socialLinks.twitter || formData.socialLinks.instagram || formData.socialLinks.youtube || formData.socialLinks.website) && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Social Links Preview:</h4>
              <div className="flex flex-wrap gap-2">
                {formData.socialLinks.twitter && (
                  <a href={formData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 text-sm">
                    Twitter
                  </a>
                )}
                {formData.socialLinks.instagram && (
                  <a href={formData.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-700 text-sm">
                    Instagram
                  </a>
                )}
                {formData.socialLinks.youtube && (
                  <a href={formData.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-700 text-sm">
                    YouTube
                  </a>
                )}
                {formData.socialLinks.website && (
                  <a href={formData.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-700 text-sm">
                    Website
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigateTo && navigateTo('admin-dashboard')}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <span className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {isEdit ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              isEdit ? 'Update Team' : 'Create Team'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TeamForm;