export const getRatingUrl = (rating: string): string => {
  // Map rating names to their URL paths based on the seeder data
  const ratingUrls: Record<string, string> = {
    "General Audiences": "/tags/General%20Audiences",
    "Teen And Up Audiences": "/tags/Teen%20And%20Up%20Audiences",
    "Teen and Up Audiences": "/tags/Teen%20And%20Up%20Audiences", // Handle both variations
    Mature: "/tags/Mature",
    Explicit: "/tags/Explicit",
    "Not Rated": "/tags/Not%20Rated",
  };

  return ratingUrls[rating] || `/tags/${encodeURIComponent(rating)}`;
};

export const getCategoryUrl = (category: string): string => {
  // Map category names to their URL paths based on the seeder data
  const categoryUrls: Record<string, string> = {
    "F/F": "/tags/F*s*F",
    "F/M": "/tags/F*s*M",
    Gen: "/tags/Gen",
    "M/M": "/tags/M*s*M",
    Multi: "/tags/Multi",
    Other: "/tags/Other",
  };

  return categoryUrls[category] || `/tags/${encodeURIComponent(category)}`;
};
