import logo from '../assets/logo.png';
import { useSiteSettings } from '../context/SiteSettingsContext';

export default function Logo({ size = 38 }: { size?: number }) {
  const { settings } = useSiteSettings();
  return <img src={settings.logoUrl || logo} alt="Bella Arte" className="brand-logo" style={{ width: size, height: size }} />;
}
