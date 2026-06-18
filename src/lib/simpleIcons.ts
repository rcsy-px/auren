import {
  siFigma,
  siGithub,
  siGmail,
  siGooglecalendar,
  siGoogledrive,
  siNotion,
  siReddit,
  siSpotify,
  siYoutube,
  type SimpleIcon,
} from "simple-icons";

const icons: Record<string, SimpleIcon> = {
  figma: siFigma,
  github: siGithub,
  gmail: siGmail,
  googlecalendar: siGooglecalendar,
  googledrive: siGoogledrive,
  notion: siNotion,
  reddit: siReddit,
  spotify: siSpotify,
  youtube: siYoutube,
};

export function getSimpleIcon(slug?: string) {
  if (!slug) return undefined;
  return icons[slug.toLowerCase().replace(/[^a-z0-9]/g, "")];
}

export const supportedIconSlugs = Object.keys(icons);
