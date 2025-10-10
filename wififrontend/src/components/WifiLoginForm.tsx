import { useState } from 'react';
import { Wifi, CheckCircle2 } from 'lucide-react';

/**
 * Form data interface - tracks all user inputs
 * Includes mobile phone number, consent checkboxes, and language preference
 */
interface FormData {
  phoneNumber: string;
  locationConsent: boolean;
  backgroundConsent: boolean;
  language: string;
}

/**
 * Form validation errors interface
 * Tracks error messages for each required field
 */
interface FormErrors {
  phoneNumber?: string;
  locationConsent?: string;
  backgroundConsent?: string;
}

const WifiLoginForm = () => {
  // State management for all form inputs
  const [formData, setFormData] = useState<FormData>({
    phoneNumber: '',
    locationConsent: false,
    backgroundConsent: false,
    language: 'English',
  });

  // Track validation errors for each field
  const [errors, setErrors] = useState<FormErrors>({});

  // Track submission state and animation state
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Available language options for emergency alerts
  const languages = ['English', 'Malayalam', 'Hindi', 'Tamil', 'Telugu'];

  /**
   * Validates all required form fields
   * Returns true if form is valid, false otherwise
   */
  const validateForm = () => {
    const newErrors: FormErrors = {};

    // Phone number validation
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    // Consent validations (both are required)
    if (!formData.locationConsent) {
      newErrors.locationConsent = 'Location access consent is required';
    }

    if (!formData.backgroundConsent) {
      newErrors.backgroundConsent = 'Background processing consent is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission
   * Validates all fields before proceeding to success screen
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      // Trigger exit animation
      setIsAnimating(true);

      // Show success screen after animation completes
      setTimeout(() => {
        setIsSubmitted(true);
      }, 300);
    }
  };

  /**
   * Handles text input changes (phoneNumber)
   * Clears error for the field being edited
   */
  const handleInputChange = (field: 'phoneNumber', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  /**
   * Handles checkbox state changes
   * Clears error when checkbox is checked
   */
  const handleCheckboxChange = (field: 'locationConsent' | 'backgroundConsent') => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field],
    }));

    // Clear error when checkbox is toggled
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Success screen shown after form submission
  if (isSubmitted) {
    return (
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 animate-fadeIn"
        style={{
          animation: 'fadeIn 0.5s ease-in',
        }}
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 bg-emerald-50 rounded-full p-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">
            You're All Set!
          </h2>
          <p className="text-gray-600 mb-2">
            Thank you for connecting. Your Wi-Fi access is now active.
          </p>
          <p className="text-gray-600">
            Emergency alerts have been enabled in {formData.language}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full max-w-md bg-white rounded-2xl shadow-lg p-8 transition-all duration-300 ${
        isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      <div className="flex flex-col items-center mb-8">
        <div className="mb-4 bg-slate-50 rounded-full p-3">
          <Wifi className="w-10 h-10 text-slate-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Welcome to AlertNet
        </h1>
        <p className="text-gray-500 text-sm text-center">
          Enter your phone number to register for emergency alerts
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Phone Number Registration Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700"
            >
              Mobile Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="Enter your mobile phone number"
              className={`w-full px-4 py-3 bg-gray-50 border ${
                errors.phoneNumber ? 'border-red-300' : 'border-gray-200'
              } rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all hover:bg-gray-100`}
              aria-label="Mobile Phone Number"
              aria-required="true"
              aria-invalid={!!errors.phoneNumber}
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-xs animate-slideIn">
                {errors.phoneNumber}
              </p>
            )}
          </div>
        </div>

        {/* Divider for visual separation */}
        <div className="border-t border-gray-200"></div>

        {/* Consent Checkboxes Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-start cursor-pointer group">
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="checkbox"
                  checked={formData.locationConsent}
                  onChange={() => handleCheckboxChange('locationConsent')}
                  className="w-5 h-5 rounded border-2 border-gray-300 text-slate-600 focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all cursor-pointer"
                  aria-label="Location tracking consent"
                  aria-required="true"
                />
              </div>
              <span className="ml-3 text-sm text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors">
                I allow location tracking to receive accurate and personalized emergency alerts for my area.
              </span>
            </label>
            {errors.locationConsent && (
              <p className="text-red-500 text-xs ml-8 animate-slideIn" role="alert">
                {errors.locationConsent}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-start cursor-pointer group">
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="checkbox"
                  checked={formData.backgroundConsent}
                  onChange={() => handleCheckboxChange('backgroundConsent')}
                  className="w-5 h-5 rounded border-2 border-gray-300 text-slate-600 focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all cursor-pointer"
                  aria-label="Background running consent"
                  aria-required="true"
                />
              </div>
              <span className="ml-3 text-sm text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors">
                I allow this app to run in the background for continuous emergency alert delivery.
              </span>
            </label>
            {errors.backgroundConsent && (
              <p className="text-red-500 text-xs ml-8 animate-slideIn" role="alert">
                {errors.backgroundConsent}
              </p>
            )}
          </div>
        </div>

        {/* Language Selection Section */}
        <div className="space-y-2">
          <label
            htmlFor="language"
            className="block text-sm font-medium text-gray-700"
          >
            Preferred Alert Language
          </label>
          <select
            id="language"
            value={formData.language}
            onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all cursor-pointer hover:bg-gray-100"
            aria-label="Preferred alert language"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-slate-700 hover:bg-slate-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 shadow-md hover:shadow-lg"
          aria-label="Register phone number and enable alerts"
        >
          Register & Enable Alerts
        </button>
      </form>

      {/* Privacy Notice */}
      <p className="mt-6 text-xs text-gray-400 text-center">
        Your privacy is important. Location data is only used for emergency alerts.
      </p>
    </div>
  );
};

export default WifiLoginForm;
