// Icon component wrapper for Font Awesome
// Usage: <Icon icon={faHome} /> or <Icon icon={faHome} className="text-accent" />

import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFacebook,
  faTwitter,
  faInstagram,
  faLinkedin,
  faYoutube,
  faWhatsapp
} from '@fortawesome/free-brands-svg-icons';

export type { IconDefinition };

interface IconProps {
  icon: IconDefinition;
  className?: string;
  size?: 'xs' | 'sm' | 'lg' | 'xl' | '2x' | '3x' | '4x' | '5x' | '6x' | '7x' | '8x' | '9x' | '10x';
  spin?: boolean;
  pulse?: boolean;
  flip?: 'horizontal' | 'vertical' | 'both';
  rotation?: 90 | 180 | 270;
}

export default function Icon({ 
  icon, 
  className = '', 
  size,
  spin = false,
  pulse = false,
  flip,
  rotation
}: IconProps) {
  return (
    <FontAwesomeIcon 
      icon={icon} 
      className={className}
      size={size}
      spin={spin}
      pulse={pulse}
      flip={flip}
      rotation={rotation}
    />
  );
}

// Export commonly used icons for convenience
export { 
  faHome,
  faUser,
  faEnvelope,
  faPhone,
  faSearch,
  faFilter,
  faPlus,
  faEdit,
  faTrash,
  faTimes,
  faCheck,
  faCheckCircle,
  faExclamationCircle,
  faTimesCircle,
  faCircle,
  faSpinner,
  faDownload,
  faUpload,
  faEye,
  faEyeSlash,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faChevronDown,
  faBars,
  faSignOut,
  faSignIn,
  faCog,
  faBell,
  faMapMarkerAlt,
  faTruck,
  faBox,
  faFileAlt,
  faCreditCard,
  faMoneyBill,
  faChartBar,
  faCalendar,
  faClock,
  faInfoCircle,
  faQuestionCircle,
  faExclamationTriangle,
  faLock,
  faDollarSign,
  faPaperPlane,
  faShieldAlt,
  faUserPlus,
  faUsers,
  faBoxOpen,
  faStar,
  faArrowRight,
  faChartLine,
  faHandshake,
  faGlobe,
  faIdCard,
  faBuilding,
  faClipboardList,
  faReceipt,
  faRightFromBracket,
  faUserShield,
  faList,
  faTh,
  faTable,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';

// Export brand icons
export {
  faFacebook,
  faTwitter,
  faInstagram,
  faLinkedin,
  faYoutube,
  faWhatsapp
};

