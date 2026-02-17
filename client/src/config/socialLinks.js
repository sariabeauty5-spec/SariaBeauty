// Social Media Configuration
// Update these URLs with your actual social media profiles

export const socialMediaConfig = {
  instagram: {
    url: 'https://instagram.com/sariabeauty.ma',
    username: '@sariabeauty.ma',
    displayName: 'Instagram'
  },
  facebook: {
    url: 'https://facebook.com/sariabeauty.ma',
    username: 'sariabeauty.ma',
    displayName: 'Facebook'
  },
  whatsapp: {
    url: 'https://wa.me/212600000000', // Moroccan WhatsApp format
    phoneNumber: '+212600000000', // Moroccan phone format
    displayName: 'WhatsApp'
  }
};

// Helper function to get social media URL
export const getSocialMediaUrl = (platform) => {
  return socialMediaConfig[platform]?.url || '#';
};

// Helper function to get social media display name
export const getSocialMediaName = (platform) => {
  return socialMediaConfig[platform]?.displayName || platform;
};

export default socialMediaConfig;