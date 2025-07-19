import React from 'react';
import { getImageUrl } from '../../utils/imageUrlUtils';

const MentionDropdown = ({
  show,
  results,
  selectedIndex,
  loading,
  position,
  onSelect,
  query = '',
  dropdownRef
}) => {
  if (!show) return null;

  // Get icon for mention type
  const getMentionIcon = (type) => {
    switch (type) {
      case 'user':
        return (
          <div className="w-6 h-6 bg-[#4ade80]/20 text-[#4ade80] rounded-full flex items-center justify-center text-xs font-medium">
            U
          </div>
        );
      case 'team':
        return (
          <div className="w-6 h-6 bg-[#fa4454]/20 text-[#fa4454] rounded-full flex items-center justify-center text-xs font-medium">
            T
          </div>
        );
      case 'player':
        return (
          <div className="w-6 h-6 bg-[#3b82f6]/20 text-[#3b82f6] rounded-full flex items-center justify-center text-xs font-medium">
            P
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="fixed z-50 bg-[#1a2332] border border-[#2b3d4d] rounded-lg shadow-xl max-h-64 overflow-y-auto min-w-[280px]"
      style={{
        top: position.top,
        left: position.left
      }}
    >
      {loading ? (
        <div className="p-3 text-center text-[#768894]">
          <div className="animate-spin w-4 h-4 border-2 border-[#fa4454] border-t-transparent rounded-full mx-auto"></div>
          <span className="text-sm mt-1 block">Searching...</span>
        </div>
      ) : results.length > 0 ? (
        <>
          {query.length === 0 && (
            <div className="px-3 py-2 text-xs text-[#768894] border-b border-[#2b3d4d]">
              Popular mentions
            </div>
          )}
          {results.map((mention, index) => (
            <div
              key={`${mention.type}-${mention.id}`}
              className={`px-3 py-2 cursor-pointer flex items-center space-x-3 hover:bg-[#2b3d4d] ${
                index === selectedIndex ? 'bg-[#fa4454]/10' : ''
              }`}
              onClick={() => onSelect(mention)}
            >
              {mention.avatar ? (
                <img 
                  src={getImageUrl(mention.avatar)} 
                  alt={mention.display_name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                getMentionIcon(mention.type)
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {mention.display_name}
                </div>
                <div className="text-xs text-[#768894] truncate">
                  {mention.subtitle}
                </div>
              </div>
              <div className="text-xs text-[#768894] font-mono">
                {mention.mention_text}
              </div>
            </div>
          ))}
        </>
      ) : query.length > 0 ? (
        <div className="p-3 text-center text-[#768894] text-sm">
          No results found for "{query}"
        </div>
      ) : null}
    </div>
  );
};

export default MentionDropdown;