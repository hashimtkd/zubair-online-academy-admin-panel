import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Save, 
  Upload, 
  MapPin, 
  Mail, 
  Smartphone, 
  Code,
  AlertCircle
} from 'lucide-react';
import { useAcademySettings } from '../hooks/useFirestore';
import { useDrive } from '../context/DriveContext';
import { getGoogleDriveImageUrl } from '../services/googleDrive';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

type ActiveTab = 'profile' | 'assets' | 'developer';

export const Settings: React.FC = () => {
  const { toast } = useToast();
  const { upload, driveStatus } = useDrive();
  const { settings, isLoading, updateSettings, isUpdating } = useAcademySettings();

  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');

  // Form Fields
  const [academyName, setAcademyName] = useState('');
  const [tagline, setTagline] = useState('');
  const [aboutUs, setAboutUs] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  
  // Media Assets Preview/Upload
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);

  // Sync state once settings query returns data
  useEffect(() => {
    if (settings) {
      setAcademyName(settings.academyName || '');
      setTagline(settings.tagline || '');
      setAboutUs(settings.aboutUs || '');
      setWhatsappNumber(settings.whatsappNumber || settings.whatsapp || '');
      setEmail(settings.email || '');
      setAddress(settings.address || '');
      setGoogleClientId(settings.googleClientId || '');
      setLogoPreview(settings.logoUrl || null);
      setHeroPreview(settings.heroImageUrl || null);
    }
  }, [settings]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleHeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setHeroFile(file);
      setHeroPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academyName) {
      toast('Academy name is a required field.', 'warning');
      return;
    }

    try {
      let logoUrl = settings?.logoUrl || '';
      let logoFileId = settings?.logoFileId || '';
      let heroImageUrl = settings?.heroImageUrl || '';
      let heroImageFileId = settings?.heroImageFileId || '';

      // Upload Logo to Google Drive if selected
      if (logoFile) {
        if (driveStatus !== 'connected') {
          toast('Google Drive authorization needed to save assets. Linking...', 'info');
        }
        const uploadResult = await upload(logoFile, 'Courses', 'AcademySettings'); // custom subfolder
        logoUrl = uploadResult.url;
        logoFileId = uploadResult.id;
      }

      // Upload Hero to Google Drive if selected
      if (heroFile) {
        if (driveStatus !== 'connected') {
          toast('Google Drive authorization needed to save assets. Linking...', 'info');
        }
        const uploadResult = await upload(heroFile, 'Courses', 'AcademySettings');
        heroImageUrl = uploadResult.url;
        heroImageFileId = uploadResult.id;
      }

      await updateSettings({
        academyName,
        tagline,
        aboutUs,
        whatsappNumber,
        whatsapp: whatsappNumber,
        email,
        address,
        googleClientId,
        logoUrl,
        logoFileId,
        heroImageUrl,
        heroImageFileId
      });

      toast('Academy configurations saved successfully.', 'success');
      
      // Reset files state
      setLogoFile(null);
      setHeroFile(null);
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to update academy settings.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-3xl">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
        <Card className="h-96 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent animate-spin rounded-full" />
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'profile' as const, label: 'General Profile', icon: <Building className="w-4 h-4" /> },
    { id: 'assets' as const, label: 'Branding Assets', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'developer' as const, label: 'Google API Setup', icon: <Code className="w-4 h-4" /> }
  ];

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Super Admin Controls</p>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 mt-1">Academy Settings</h2>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-850/60 gap-1 overflow-x-auto shrink-0 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'border-green-600 text-green-600 dark:text-green-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Settings Form Card */}
      <Card>
        <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
          
          {/* TAB 1: GENERAL PROFILE */}
          {activeTab === 'profile' && (
            <div className="flex flex-col gap-5">
              <Input
                label="Academy Name"
                placeholder="Zubair Online Academy"
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                required
              />
              
              <Input
                label="Academy Tagline"
                placeholder="Empowering Minds, Shaping Futures"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-750 dark:text-slate-350 tracking-wide uppercase">
                  About Us Description
                </label>
                <textarea
                  className="w-full text-sm rounded-xl border border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 px-4 py-2.5 min-h-[100px]"
                  placeholder="Provide an overview describing the academy for public presentation."
                  value={aboutUs}
                  onChange={(e) => setAboutUs(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Contact Email"
                  type="email"
                  placeholder="info@zubairacademy.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                />
                <Input
                  label="WhatsApp Number"
                  placeholder="+923001234567"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  leftIcon={<Smartphone className="w-4 h-4 text-slate-400" />}
                />
              </div>

              <Input
                label="Office Physical Address"
                placeholder="Sector F-8, Islamabad, Pakistan"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
              />
            </div>
          )}

          {/* TAB 2: BRANDING ASSETS */}
          {activeTab === 'assets' && (
            <div className="flex flex-col gap-6">
              
              {/* Logo Upload Field */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-355 uppercase tracking-wider">Academy Brand Logo</span>
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                  <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                    {logoPreview ? (
                      <img src={getGoogleDriveImageUrl(logoPreview)} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  
                  <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 p-4.5 rounded-xl cursor-pointer transition-colors text-xs font-bold text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4 text-green-500" />
                      <span>Select Logo File (Stores in Google Drive)</span>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleLogoChange} 
                    />
                  </label>
                </div>
              </div>

              {/* Hero Banner Upload Field */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-355 uppercase tracking-wider">Homepage Hero Banner</span>
                <div className="flex flex-col gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                  {heroPreview && (
                    <div className="w-full h-44 bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                      <img src={getGoogleDriveImageUrl(heroPreview)} alt="Hero Banner" className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  <label className="flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 p-6 rounded-xl cursor-pointer transition-colors text-xs font-bold text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4 text-green-500" />
                      <span>Upload Hero Image (Stores in Google Drive)</span>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleHeroChange} 
                    />
                  </label>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: DEVELOPER SETTINGS (GOOGLE CLIENT ID) */}
          {activeTab === 'developer' && (
            <div className="flex flex-col gap-5">
              <div className="flex gap-3 p-4 rounded-xl border border-blue-200/50 dark:border-blue-950/40 bg-blue-50/50 dark:bg-blue-955/10 text-blue-700 dark:text-blue-400 text-xs leading-relaxed">
                <AlertCircle className="w-5 h-5 shrink-0 text-blue-500" />
                <div className="space-y-1">
                  <span className="font-bold">Google API Configuration Guide</span>
                  <p>
                    Enter your Google Cloud Console OAuth 2.0 Web Client ID below. This client ID enables the frontend panel to authorize files uploading, backup storage, and directory management on behalf of your Google Account.
                  </p>
                </div>
              </div>

              <Input
                label="Google OAuth Web Client ID"
                placeholder="123456789-xxxxxxxxxx.apps.googleusercontent.com"
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
                leftIcon={<LinkIcon className="w-4 h-4 text-slate-400" />}
                helperText="Must match settings in Google Cloud APIs Credentials console."
              />
            </div>
          )}

          {/* Submit Actions */}
          <div className="border-t border-slate-100 dark:border-slate-850/60 pt-5 mt-2 flex items-center justify-end">
            <Button
              type="submit"
              leftIcon={<Save className="w-4 h-4" />}
              isLoading={isUpdating}
            >
              Save Configuration Settings
            </Button>
          </div>

        </form>
      </Card>
    </div>
  );
};
export default Settings;
