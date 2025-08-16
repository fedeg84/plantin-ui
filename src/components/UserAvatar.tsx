import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { fileApi } from '../api/endpoints';

interface UserAvatarProps {
  pictureId?: number;
  username: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  pictureId,
  username,
  size = 'medium',
  className = ''
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Size configurations
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  useEffect(() => {
    if (pictureId && !imageError) {
      fileApi.download(pictureId)
        .then(url => {
          setImageUrl(url);
          setImageError(false);
        })
        .catch(error => {
          console.error('Error loading user avatar:', error);
          setImageError(true);
          setImageUrl(null);
        });
    } else {
      setImageUrl(null);
    }
  }, [pictureId, imageError]);

  const handleImageError = () => {
    setImageError(true);
    setImageUrl(null);
  };

  // Generate initials from username
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center overflow-hidden ${className}`}>
      {imageUrl && !imageError ? (
        <img
          src={imageUrl}
          alt={`Avatar de ${username}`}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
          {username ? (
            <span className={`text-white font-semibold ${size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-lg'}`}>
              {getInitials(username)}
            </span>
          ) : (
            <User className={`${iconSizes[size]} text-gray-400`} />
          )}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
