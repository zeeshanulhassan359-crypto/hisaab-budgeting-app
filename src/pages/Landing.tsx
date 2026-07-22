import React, { useState, useEffect, useRef, useCallback } from "react";
import { Shield, Globe, Award, Sparkles, User, Mail, UserCheck, Lock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { HisaabLogo } from "../components/HisaabLogo";
import { ThemeToggle } from "../components/ThemeToggle";
import { loginWithMicrosoft } from "../services/auth";
import { sendOtpEmail, isEmailServiceConfigured } from "../services/emailService";

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  provider: "google" | "microsoft" | "apple" | "credentials";
}

interface RegisteredAccount {
  name: string;
  email: string;
  password?: string;
  provider: "google" | "microsoft" | "apple" | "credentials";
}

interface LandingProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
  onLoginSuccess: (profile: UserProfile) => void;
}

export const Landing: React.FC<LandingProps> = ({ theme, toggleTheme, onLoginSuccess }) => {
  const [showModal, setShowModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [selectedProvider, setSelectedProvider] = useState<"google" | "apple" | "credentials">("credentials");
  
  // Auth navigation steps
  const [authStep, setAuthStep] = useState<"form" | "otp">("form");

  // Signup fields
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePassword, setProfilePassword] = useState("");

  // Sign-in fields
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // OTP Verification fields
  const [otpInput, setOtpInput] = useState<string[]>(Array(6).fill(""));
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [pendingProfile, setPendingProfile] = useState<RegisteredAccount | null>(null);

  // General error/success feedback
  const [authError, setAuthError] = useState("");

  // Email sending states
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [isOtpExpired, setIsOtpExpired] = useState(false);
  const emailConfigured = useRef(isEmailServiceConfigured());
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    };
  }, []);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownTimerRef.current = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [resendCooldown]);

  // Start OTP expiry timer (10 minutes)
  const startOtpExpiry = useCallback(() => {
    setIsOtpExpired(false);
    const expiryTime = Date.now() + 10 * 60 * 1000; // 10 minutes
    setOtpExpiresAt(expiryTime);
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    expiryTimerRef.current = setTimeout(() => {
      setIsOtpExpired(true);
      setOtpError("Verification code has expired. Please request a new one.");
    }, 10 * 60 * 1000);
  }, []);

  // Generate OTP and send email (or simulate)
  const generateAndSendOtp = useCallback(async (profile: RegisteredAccount): Promise<boolean> => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);

    if (emailConfigured.current) {
      // Real email sending via EmailJS
      setIsSendingOtp(true);
      const result = await sendOtpEmail(profile.email, profile.name, code);
      setIsSendingOtp(false);

      if (!result.success) {
        setAuthError(result.message);
        return false;
      }
    }
    // If not configured, falls back to simulation (OTP shown on screen)

    startOtpExpiry();
    setResendCooldown(60);
    return true;
  }, [startOtpExpiry]);

  // Retrieve accounts from localStorage
  const getRegisteredAccounts = (): RegisteredAccount[] => {
    try {
      return JSON.parse(localStorage.getItem("hisaab_registered_accounts") || "[]");
    } catch {
      return [];
    }
  };

  // Register account in localStorage
  const saveRegisteredAccount = (account: RegisteredAccount) => {
    const accounts = getRegisteredAccounts();
    const filtered = accounts.filter(a => a.email.toLowerCase() !== account.email.toLowerCase());
    filtered.push(account);
    localStorage.setItem("hisaab_registered_accounts", JSON.stringify(filtered));
  };

  // Microsoft MSAL actual auth
  const handleMicrosoftLogin = async () => {
    try {
      const account = await loginWithMicrosoft();
      if (account) {
        const profile: UserProfile = {
          name: account.name || "Microsoft User",
          email: account.username,
          provider: "microsoft",
        };
        onLoginSuccess(profile);
      }
    } catch (err) {
      console.error("Microsoft login failed:", err);
      alert("Hotmail/Microsoft authentication failed. Please try again.");
    }
  };

  // Handle Initial Form Submission (Sign Up / Sign In)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setOtpError("");

    if (authMode === "signup") {
      // Sign Up Phase: Input validation
      if (!profileName.trim() || !profileEmail.trim() || !profilePassword.trim()) {
        setAuthError("All fields are required.");
        return;
      }
      if (profilePassword.length < 6) {
        setAuthError("Password must be at least 6 characters.");
        return;
      }

      // Check if account already exists
      const accounts = getRegisteredAccounts();
      const exists = accounts.some(a => a.email.toLowerCase() === profileEmail.toLowerCase().trim());
      if (exists) {
        setAuthError("An account with this email already exists.");
        return;
      }

      const profile: RegisteredAccount = {
        name: profileName.trim(),
        email: profileEmail.trim().toLowerCase(),
        password: profilePassword,
        provider: selectedProvider,
      };

      setPendingProfile(profile);

      // Send OTP email (real or simulated)
      const success = await generateAndSendOtp(profile);
      if (!success) return;

      // Reset OTP inputs and proceed to verification step
      setOtpInput(Array(6).fill(""));
      setAuthStep("otp");
    } else {
      // Sign In Phase: Credential validation
      if (!signInEmail.trim() || !signInPassword.trim()) {
        setAuthError("Please fill in both email and password.");
        return;
      }

      const accounts = getRegisteredAccounts();
      const matchedUser = accounts.find(
        a => 
          (a.email.toLowerCase() === signInEmail.toLowerCase().trim() || a.name.toLowerCase() === signInEmail.toLowerCase().trim()) &&
          a.password === signInPassword
      );

      if (matchedUser) {
        // Successful credentials verification -> Proceed to OTP step
        const profile: RegisteredAccount = {
          name: matchedUser.name,
          email: matchedUser.email,
          password: matchedUser.password,
          provider: matchedUser.provider,
        };

        setPendingProfile(profile);

        // Send OTP email (real or simulated)
        const success = await generateAndSendOtp(profile);
        if (!success) return;

        // Reset OTP inputs and proceed to verification step
        setOtpInput(Array(6).fill(""));
        setAuthStep("otp");
      } else {
        setAuthError("Invalid username/email or password.");
      }
    }
  };

  // OTP inputs handle key changes
  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otpInput];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtpInput(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  // OTP inputs backspace focus
  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otpInput[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  // OTP inputs handle paste event
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    const cleanCode = pasteData.replace(/\D/g, "").slice(0, 6);
    
    if (cleanCode.length > 0) {
      const newOtp = [...otpInput];
      for (let i = 0; i < 6; i++) {
        if (i < cleanCode.length) {
          newOtp[i] = cleanCode[i];
        }
      }
      setOtpInput(newOtp);

      // Focus the input corresponding to the end of the pasted code (up to index 5)
      const targetIndex = Math.min(cleanCode.length - 1, 5);
      const targetInput = document.getElementById(`otp-${targetIndex}`);
      targetInput?.focus();
    }
  };

  // Verify OTP and complete signup
  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    const code = otpInput.join("");

    if (code.length < 6) {
      setOtpError("Please enter all 6 digits.");
      return;
    }

    if (isOtpExpired) {
      setOtpError("Verification code has expired. Please request a new one.");
      return;
    }

    if (code === generatedOtp && pendingProfile) {
      // Success: Save account to local database only on signup
      if (authMode === "signup") {
        saveRegisteredAccount(pendingProfile);
      }

      // Clear timers
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);

      // Automatically log the user in
      onLoginSuccess({
        name: pendingProfile.name,
        email: pendingProfile.email,
        provider: pendingProfile.provider,
      });

      // Clear states
      setShowModal(false);
      setPendingProfile(null);
      setAuthStep("form");
      setOtpExpiresAt(null);
    } else {
      setOtpError(emailConfigured.current
        ? "Incorrect verification code. Please check your email inbox."
        : "Incorrect verification code. Please check the simulated email OTP above."
      );
    }
  };

  // Handle resend OTP with cooldown
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !pendingProfile || isSendingOtp) return;
    setOtpError("");
    setOtpInput(Array(6).fill(""));
    await generateAndSendOtp(pendingProfile);
  };

  // Open modal helper
  const openAuthModal = (mode: "signup" | "signin", provider: "google" | "apple" | "credentials") => {
    setAuthMode(mode);
    setSelectedProvider(provider);
    setAuthStep("form");
    setAuthError("");
    setOtpError("");
    
    // Auto-fill mock fields for Google/Apple to streamline signup demo
    if (mode === "signup") {
      if (provider === "google") {
        setProfileName("Zeeshan Hassan");
        setProfileEmail("zeeshan.hassan@gmail.com");
        setProfilePassword("zeeshan123");
      } else if (provider === "apple") {
        setProfileName("Alex Mercer");
        setProfileEmail("alex.mercer@icloud.com");
        setProfilePassword("alexmercer");
      } else {
        setProfileName("");
        setProfileEmail("");
        setProfilePassword("");
      }
    } else {
      // Fill credentials of last registered user if any
      const accounts = getRegisteredAccounts();
      if (accounts.length > 0) {
        setSignInEmail(accounts[accounts.length - 1].email);
        setSignInPassword(accounts[accounts.length - 1].password || "");
      } else {
        setSignInEmail("");
        setSignInPassword("");
      }
    }

    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-bg-app text-text-primary flex flex-col transition-colors duration-300 relative overflow-hidden">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent-custom/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-[1200px] mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 h-12 overflow-visible">
          <HisaabLogo size={44} />
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          <button
            onClick={() => openAuthModal("signin", "credentials")}
            className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => openAuthModal("signup", "credentials")}
            className="px-5 py-2.5 bg-accent-custom text-accent-custom-fg rounded-full text-xs font-bold hover:opacity-90 transition shadow-lg cursor-pointer"
          >
            Create Profile
          </button>
        </div>
      </header>

      {/* Hero Body */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 py-12 z-10">
        
        {/* Left Column: Text pitch */}
        <div className="flex-1 flex flex-col gap-6 text-center lg:text-left max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-custom-bg/20 border border-accent-custom/20 text-accent-custom text-xs font-bold tracking-wide self-center lg:self-start">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Premium Wealth Orchestration</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-text-primary">
            Master your wealth, <br />
            <span className="bg-linear-to-r from-accent-custom to-emerald-500 bg-clip-text text-transparent">
              without friction.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-text-secondary font-medium leading-relaxed">
            Hisaab is a premium, localized personal budgeting application. Organize your cards, track milestone savings goals, analyze reports, and sync securely with private spreadsheets.
          </p>

          {/* Social signup cluster in hero */}
          <div className="flex flex-col gap-3 mt-4 sm:flex-row justify-center lg:justify-start">
            <button
              onClick={() => openAuthModal("signup", "google")}
              className="flex items-center justify-center gap-2.5 px-6 h-12 border border-border-custom bg-bg-card hover:bg-bg-elevated rounded-full text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {/* Google SVG logo */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.7 0 3.2.6 4.4 1.8l3.3-3.3C17.7 1.5 15 0 12 0 7.3 0 3.3 2.7 1.3 6.6l3.9 3c1-2.7 3.5-4.56 6.8-4.56z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.1-2 3.7-4.9 3.7-8.7z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.2 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.3 6.2C.5 8 .1 10 .1 12s.4 4 1.2 5.8l3.9-3z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.2 0 6-1.1 8-2.9l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.3 0-5.8-1.9-6.8-4.6l-3.9 3C3.3 21.3 7.3 24 12 24z"
                />
              </svg>
              <span>Get Started with Google</span>
            </button>

            <button
              onClick={handleMicrosoftLogin}
              className="flex items-center justify-center gap-2.5 px-6 h-12 bg-linear-to-r from-blue-600 to-indigo-700 text-white hover:opacity-90 rounded-full text-xs font-bold transition shadow-md cursor-pointer"
            >
              {/* Microsoft SVG logo */}
              <svg className="w-4 h-4" viewBox="0 0 23 23">
                <path fill="#f35325" d="M0 0h11v11H0z" />
                <path fill="#81bc06" d="M12 0h11v11H12z" />
                <path fill="#05a6f0" d="M0 12h11v11H0z" />
                <path fill="#ffba08" d="M12 12h11v11H12z" />
              </svg>
              <span>Continue with Hotmail</span>
            </button>
          </div>

          <div className="flex items-center justify-center lg:justify-start gap-6 text-[11px] text-text-tertiary font-semibold mt-4">
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-success-custom" /> Zero Cloud Tracking</span>
            <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-accent-custom" /> Syncs with Local Folders</span>
            <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-purple-500" /> Premium Local Crypt</span>
          </div>
        </div>

        {/* Right Column: Visual app preview mockup */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md lg:max-w-none relative">
          
          {/* Glass Card 1: Balance Widget */}
          <div className="glass-panel p-5 w-72 absolute top-[-40px] left-[-20px] shadow-2xl animate-fade-in-up duration-500 z-10">
            <div className="flex items-center justify-between border-b border-border-custom/30 pb-2 mb-3">
              <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold">Net Capital</span>
              <span className="text-[9px] text-success-custom bg-success-custom-bg px-2 py-0.5 rounded-full font-bold">Active</span>
            </div>
            <div className="text-2xl font-black tracking-tight text-text-primary">
              SAR 10,009.50
            </div>
            <p className="text-[10px] text-text-secondary mt-1 font-medium">Synced with SNB and Al Rajhi</p>
          </div>

          {/* Core Card Mockup: Visual representation of bank card */}
          <div className="w-[340px] h-[210px] bg-linear-to-br from-purple-600 to-pink-700 rounded-3xl p-6 shadow-2xl relative flex flex-col justify-between overflow-hidden text-white border border-white/10 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
            <div className="absolute right-[-40px] bottom-[-40px] w-48 h-48 rounded-full bg-white/5 blur-xl pointer-events-none" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] uppercase tracking-widest font-black opacity-80">Premium Credit Card</p>
                <h4 className="text-lg font-bold mt-1">Al Rajhi Credit</h4>
              </div>
              <span className="text-[10px] font-black tracking-widest bg-white/20 px-3 py-1 rounded-full border border-white/10 uppercase">Mada</span>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[8px] uppercase tracking-widest font-bold opacity-60">Card Number</p>
                <p className="text-sm font-semibold tracking-wider font-mono mt-1">•••• •••• •••• 8912</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] uppercase tracking-widest font-bold opacity-60">Limit</p>
                <p className="text-sm font-bold mt-1">SAR 10,000</p>
              </div>
            </div>
          </div>

          {/* Glass Card 2: Spending Goal */}
          <div className="glass-panel p-4 w-64 absolute bottom-[-45px] right-[-10px] shadow-2xl z-10 flex flex-col gap-2 transform rotate-[1deg] hover:rotate-0 transition-transform duration-500">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-text-primary">Emergency Fund</span>
              <span className="text-accent-custom font-bold">50% Goal</span>
            </div>
            <div className="w-full bg-border-custom/40 h-2 rounded-full overflow-hidden">
              <div className="bg-accent-custom h-full w-1/2 rounded-full" />
            </div>
            <div className="flex justify-between items-center text-[9px] text-text-tertiary">
              <span>SAR 5,000</span>
              <span>Target: SAR 10,000</span>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-[10px] text-text-tertiary border-t border-border-custom/40 font-semibold z-10">
        © 2026 Hisaab budgeting app. Secure local database execution.
      </footer>

      {/* Auth Setup Modal (Simulated Google, Apple, and Custom Email Credentials) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl relative border border-border-custom/50 animate-scale-in">
            {/* Close */}
            <button
              onClick={() => {
                setShowModal(false);
                setAuthStep("form");
              }}
              className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary font-bold text-lg cursor-pointer"
            >
              ✕
            </button>

            {/* Step 1: Signup / Signin Input Form */}
            {authStep === "form" && (
              <>
                <div className="flex flex-col items-center text-center gap-2 mb-2">
                  <div className="w-12 h-12 rounded-full bg-accent-custom-bg/20 flex items-center justify-center text-accent-custom">
                    {selectedProvider === "google" ? (
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12 5.04c1.7 0 3.2.6 4.4 1.8l3.3-3.3C17.7 1.5 15 0 12 0 7.3 0 3.3 2.7 1.3 6.6l3.9 3c1-2.7 3.5-4.56 6.8-4.56z"
                        />
                        <path
                          fill="#4285F4"
                          d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.1-2 3.7-4.9 3.7-8.7z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.2 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.3 6.2C.5 8 .1 10 .1 12s.4 4 1.2 5.8l3.9-3z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.2 0 6-1.1 8-2.9l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.3 0-5.8-1.9-6.8-4.6l-3.9 3C3.3 21.3 7.3 24 12 24z"
                        />
                      </svg>
                    ) : selectedProvider === "apple" ? (
                      <svg className="w-6 h-6 fill-current text-text-primary" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.63.73-1.18 1.87-1.03 2.98.12.01.24.02.36.02.94 0 2.08-.63 2.62-1.44z" />
                      </svg>
                    ) : (
                      <HisaabLogo size={32} />
                    )}
                  </div>
                  <h3 className="text-base font-black text-text-primary mt-1 capitalize">
                    {authMode === "signup" ? `Create Hisaab Profile` : `Sign In to Profile`}
                  </h3>
                  <p className="text-[11px] text-text-tertiary font-semibold leading-relaxed">
                    {authMode === "signup" 
                      ? `Sign up using your ${selectedProvider === "credentials" ? "email credentials" : selectedProvider + " account"}.`
                      : "Enter your username/email and password."}
                  </p>
                </div>

                {/* Validation Error Alert */}
                {authError && (
                  <div className="flex items-center gap-2 p-3 bg-expense-custom-bg/25 border border-expense-custom/20 rounded-xl text-expense-custom text-[11px] font-bold animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className="flex flex-col gap-3 text-xs">
                  {authMode === "signup" ? (
                    /* SIGN UP FORM */
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-text-secondary font-bold flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-text-tertiary" /> Name
                        </label>
                        <input
                          type="text"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          placeholder="e.g. Zeeshan Hassan"
                          className="w-full h-10 px-3.5 py-2.5 bg-border-custom/10 border border-border-custom rounded-xl font-medium text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent-custom/40"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-text-secondary font-bold flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-text-tertiary" /> Email Address
                        </label>
                        <input
                          type="email"
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          placeholder="e.g. zeeshan@gmail.com"
                          className="w-full h-10 px-3.5 py-2.5 bg-border-custom/10 border border-border-custom rounded-xl font-medium text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent-custom/40"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-text-secondary font-bold flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-text-tertiary" /> Create Password
                        </label>
                        <input
                          type="password"
                          value={profilePassword}
                          onChange={(e) => setProfilePassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full h-10 px-3.5 py-2.5 bg-border-custom/10 border border-border-custom rounded-xl font-medium text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent-custom/40"
                          required
                        />
                      </div>
                    </>
                  ) : (
                    /* SIGN IN FORM */
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-text-secondary font-bold flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-text-tertiary" /> Email / Username
                        </label>
                        <input
                          type="text"
                          value={signInEmail}
                          onChange={(e) => setSignInEmail(e.target.value)}
                          placeholder="Enter your email or username"
                          className="w-full h-10 px-3.5 py-2.5 bg-border-custom/10 border border-border-custom rounded-xl font-medium text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent-custom/40"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-text-secondary font-bold flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-text-tertiary" /> Password
                        </label>
                        <input
                          type="password"
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full h-10 px-3.5 py-2.5 bg-border-custom/10 border border-border-custom rounded-xl font-medium text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent-custom/40"
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-text-tertiary mt-1 font-semibold">
                    <span 
                      onClick={() => {
                        setAuthMode(authMode === "signup" ? "signin" : "signup");
                        setAuthError("");
                      }}
                      className="hover:text-accent-custom underline cursor-pointer"
                    >
                      {authMode === "signup" ? "Already registered? Sign In" : "New user? Create Profile"}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingOtp}
                    className="w-full h-11 bg-accent-custom hover:bg-accent-custom-hover text-accent-custom-fg rounded-full font-bold transition mt-3 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSendingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending verification email...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>{authMode === "signup" ? "Proceed to Verify OTP" : "Sign In to Profile"}</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* Step 2: Simulated OTP Verification Form */}
            {authStep === "otp" && pendingProfile && (
              <>
                <div className="flex flex-col items-center text-center gap-2 mb-2">
                  <div className="w-12 h-12 rounded-full bg-accent-custom-bg/20 flex items-center justify-center text-accent-custom">
                    <Mail className="w-6 h-6 text-accent-custom" />
                  </div>
                  <h3 className="text-base font-black text-text-primary mt-1">
                    Enter Verification Code
                  </h3>
                  <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                    We sent a 6-digit OTP code to <strong className="text-text-primary">{pendingProfile.email}</strong>.
                  </p>
                </div>

                {/* Email Status Notification */}
                {emailConfigured.current ? (
                  /* Real Email Sent Confirmation */
                  <div className="p-3.5 bg-success-custom-bg/25 border border-success-custom/25 rounded-2xl flex flex-col gap-1.5 text-xs text-left animate-fade-in">
                    <div className="flex items-center gap-1.5 text-success-custom font-black uppercase tracking-wider text-[10px]">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Verification Email Sent</span>
                    </div>
                    <p className="text-text-secondary font-medium leading-relaxed">
                      A 6-digit verification code has been sent to <strong className="text-text-primary">{pendingProfile.email}</strong>. 
                      Please check your inbox (and spam folder) and enter the code below.
                    </p>
                    {otpExpiresAt && !isOtpExpired && (
                      <p className="text-[10px] text-text-tertiary font-semibold mt-0.5">
                        Code expires in 10 minutes.
                      </p>
                    )}
                    {isOtpExpired && (
                      <p className="text-[10px] text-expense-custom font-bold mt-0.5">
                        ⚠ Code has expired. Click "Resend Code" to get a new one.
                      </p>
                    )}
                  </div>
                ) : (
                  /* Simulation Fallback - EmailJS not configured */
                  <div className="p-3.5 bg-accent-custom-bg/25 border border-accent-custom/25 rounded-2xl flex flex-col gap-1.5 text-xs text-left animate-fade-in">
                    <div className="flex items-center gap-1.5 text-accent-custom font-black uppercase tracking-wider text-[10px]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Hisaab Verification Email (Demo Mode)</span>
                    </div>
                    <p className="text-text-secondary font-medium leading-relaxed">
                      Email service not configured. Using simulation mode. <br />
                      Your code is: <strong className="text-accent-custom text-sm font-black tracking-widest bg-accent-custom-bg/40 px-2 py-0.5 rounded-md inline-block">{generatedOtp}</strong>
                    </p>
                    <p className="text-[9px] text-text-tertiary mt-0.5">
                      To enable real emails, configure EmailJS in your .env file.
                    </p>
                  </div>
                )}

                {/* Validation Error Alert */}
                {otpError && (
                  <div className="flex items-center gap-2 p-3 bg-expense-custom-bg/25 border border-expense-custom/20 rounded-xl text-expense-custom text-[11px] font-bold animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}

                {/* 6-Digit OTP Inputs */}
                <form onSubmit={handleOtpVerify} className="flex flex-col gap-4 mt-1">
                  <div className="flex justify-between gap-2.5">
                    {otpInput.map((val, idx) => (
                      <input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        maxLength={1}
                        value={val}
                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                        onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        onPaste={handleOtpPaste}
                        className="w-11 h-12 text-center text-lg font-black bg-border-custom/10 border border-border-custom rounded-xl text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent-custom/50"
                        required
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-text-tertiary font-semibold mt-1">
                    <span 
                      onClick={() => setAuthStep("form")}
                      className="hover:text-accent-custom underline cursor-pointer"
                    >
                      ← Back to details
                    </span>
                    <span 
                      onClick={handleResendOtp}
                      className={`underline ${resendCooldown > 0 || isSendingOtp ? "opacity-40 cursor-not-allowed" : "hover:text-accent-custom cursor-pointer"}`}
                    >
                      {isSendingOtp
                        ? "Sending..."
                        : resendCooldown > 0
                          ? `Resend Code (${resendCooldown}s)`
                          : "Resend Code"}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isOtpExpired || isSendingOtp}
                    className="w-full h-11 bg-accent-custom hover:bg-accent-custom-hover text-accent-custom-fg rounded-full font-bold transition mt-2 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{isOtpExpired ? "Code Expired — Resend" : authMode === "signup" ? "Verify & Register Profile" : "Verify & Sign In"}</span>
                  </button>
                </form>
              </>
            )}

            <div className="border-t border-border-custom/40 pt-3 text-center text-[10px] text-text-tertiary leading-relaxed font-semibold">
              {emailConfigured.current
                ? "Your profile is stored securely in your browser's private local vault. Verification emails are sent via a secure email service."
                : "This simulated authentication saves your profile info in your browser's private local vault."
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
