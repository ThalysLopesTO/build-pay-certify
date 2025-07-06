import React from 'react';
import { User } from 'lucide-react';

interface EmployeeAvatarProps {
  photoUrl?: string | null;
  firstName?: string;
  lastName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const EmployeeAvatar: React.FC<EmployeeAvatarProps> = ({
  photoUrl,
  firstName = '',
  lastName = '',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16', 
    lg: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  if (photoUrl) {
    return (
      <div className={`${sizeClasses[size]} rounded-full relative ${className}`}>
        <img
          src={photoUrl}
          alt={`${firstName} ${lastName}`}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gray-200`}
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            const target = e.currentTarget;
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="${sizeClasses[size]} rounded-full bg-muted flex items-center justify-center border-2 border-gray-200">
                  ${initials ? 
                    `<span class="text-muted-foreground font-medium ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg'}">${initials}</span>` :
                    `<svg class="${iconSizes[size]} text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>`
                  }
                </div>
              `;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-muted flex items-center justify-center border-2 border-gray-200 ${className}`}>
      {initials ? (
        <span className={`text-muted-foreground font-medium ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg'}`}>
          {initials}
        </span>
      ) : (
        <User className={`${iconSizes[size]} text-muted-foreground`} />
      )}
    </div>
  );
};

export default EmployeeAvatar;