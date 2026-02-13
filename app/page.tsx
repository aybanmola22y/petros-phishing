"use client"

import type React from "react"
import { useState, type FormEvent, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Mail, Lock, Eye, EyeOff, Skull } from "lucide-react"
import { useEffect } from "react"





interface FormData {
  email: string
  password: string
  confirmPassword: string
}



interface CompromisedData {
  personalInfo: {
    email: string
    password: string
    employeeId: string
    department: string
    accessLevel: string
  }
  companyData: {
    contacts: number
    documents: number
    systemAccess: string[]
    financialRecords: string
  }
  networkInfo: {
    ipAddress: string
    location: string
    connectedDevices: number
  }
}


const PasswordResetSimulation: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false)
  const [showTwist, setShowTwist] = useState<boolean>(false)
  const [countdown, setCountdown] = useState<number>(5)
  const [errors, setErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [progressStep, setProgressStep] = useState<number>(0)
  const [compromisedData, setCompromisedData] = useState<CompromisedData | null>(null)

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = (): string[] => {
    const newErrors: string[] = []

    if (!formData.email) {
      newErrors.push("Email is required")
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.push("Please enter a valid email address")
    }

    if (!formData.password) {
      newErrors.push("Password is required")
    } else if (formData.password.length < 8) {
      newErrors.push("Password must be at least 8 characters")
    }

    if (!formData.confirmPassword) {
      newErrors.push("Please confirm your password")
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.push("Passwords do not match")
    }

    return newErrors
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    const validationErrors = validateForm()
    setErrors(validationErrors)

    if (validationErrors.length === 0) {
      setIsLoading(true)

      // Log the compromised attempt immediately
      fetch("/api/log-visit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: "simulation_failure",
          email: formData.email,
        }),
      }).catch((err) => console.error("Logging failed", err))

      setProgressStep(0)

      // Simulate data acquisition process
      const steps = [
        { step: 1, message: "Validating credentials...", delay: 800 },
        { step: 2, message: "Accessing company database...", delay: 1000 },
        { step: 3, message: "Extracting employee information...", delay: 900 },
        { step: 4, message: "Harvesting contact lists...", delay: 700 },
        { step: 5, message: "Compromising system access...", delay: 600 },
      ]

      // Simulate the malicious data extraction process
      for (const { step, delay } of steps) {
        setProgressStep(step)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }

      // Simulate gathering compromised data
      const mockCompromisedData = {
        personalInfo: {
          email: formData.email,
          password: formData.password,
          employeeId: "EMP" + Math.floor(Math.random() * 10000),
          department: "Operation",
          accessLevel: "Administrator",
        },
        companyData: {
          contacts: Math.floor(Math.random() * 500) + 100,
          documents: Math.floor(Math.random() * 1000) + 200,
          systemAccess: ["Email Server", "File Server", "Database", "Client informations"],
          financialRecords: "Accessible",
        },
        networkInfo: {
          ipAddress: "192.168.1." + Math.floor(Math.random() * 255),
          location: "Office Network",
          connectedDevices: Math.floor(Math.random() * 20) + 5,
        },
      }

      setCompromisedData(mockCompromisedData)
      setIsLoading(false)
      setShowTwist(true)
      setCountdown(5)
    }
  }

  const togglePasswordVisibility = (field: "password" | "confirmPassword"): void => {
    if (field === "password") {
      setShowPassword(!showPassword)
    } else {
      setShowConfirmPassword(!showConfirmPassword)
    }
  }

  const resetSimulation = (): void => {
    setFormData({ email: "", password: "", confirmPassword: "" })
    setIsSubmitted(false)
    setShowTwist(false)
    setErrors([])
    setShowPassword(false)
    setShowConfirmPassword(false)
  }


  useEffect(() => {
    // Collect IP and timestamp, and optionally, logged email if available
    const trackVisitor = async () => {
      try {
        await fetch("/api/log-visit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event: "page_visited",
            email: formData.email || null,
            timestamp: new Date().toISOString(),
          }),
        })
      } catch (err) {
        console.error("Tracking failed", err)
      }
    }

    trackVisitor()
  }, [formData.email])

  useEffect(() => {
    if (showTwist && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (showTwist && countdown === 0) {
      setShowTwist(false)
      setIsSubmitted(true)
    }
  }, [showTwist, countdown])

  if (isLoading) {
    const progressMessages = [
      "Authenticating session...",
      "Syncing with corporate directory...",
      "Validating access permissions...",
      "Updating security certificates...",
      "Finalizing synchronization...",
    ]

    return (
      <div className="min-h-screen mesh-gradient flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-morphism border-none shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-6 w-16 h-16 bg-blue-50/50 rounded-2xl flex items-center justify-center border border-blue-100/50">
              <Lock className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">Secure Processing</CardTitle>
            <CardDescription className="text-slate-500">Establishing encrypted connection to Petrosphere Auth</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-8">
            <div className="space-y-4">
              <div className="w-full bg-slate-200/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-in-out"
                  style={{ width: `${(progressStep / 5) * 100}%` }}
                ></div>
              </div>
              <p className="text-center text-sm font-medium text-slate-600 animate-pulse">
                {progressMessages[progressStep - 1] || "Initializing..."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-4">
              {[
                { label: "Directory Sync", step: 2 },
                { label: "Credential Token", step: 3 },
                { label: "Identity Verified", step: 4 },
              ].map((item, i) => (
                <div key={i} className={`flex items-center justify-between text-xs transition-opacity duration-500 ${progressStep >= item.step ? 'opacity-100' : 'opacity-30'}`}>
                  <span className="text-slate-500 font-medium">{item.label}</span>
                  <span className="text-blue-600 font-bold">ACTIVE</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showTwist) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 overflow-hidden relative">
        {/* Matrix-like background effect */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent"></div>
        </div>

        <div className="text-center space-y-8 relative z-10 animate-in fade-in zoom-in duration-700">
          <div className="relative mx-auto w-32 h-32">
            <div className="absolute inset-0 bg-red-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
            <div className="relative bg-red-950/30 border-2 border-red-500/50 rounded-full w-full h-full flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.3)]">
              <Skull className="w-16 h-16 text-red-500" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              YOU&apos;VE BEEN <span className="text-red-600">HACKED!</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium tracking-[0.2em] font-mono leading-none">SYSTEM VULNERABILITY EXPLOITED</p>
          </div>

          <div className="max-w-xl mx-auto">
            <div className="bg-red-950/20 border border-red-500/20 p-8 rounded-3xl backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>
              <p className="text-red-200 text-2xl font-bold italic leading-relaxed mb-4">
                &quot;Why did the hacker get lost? Because he couldn&apos;t find the &apos;backdoor&apos;!&quot;
              </p>
              <div className="text-slate-500 font-mono text-sm border-t border-red-500/10 pt-4">
                DATA EXTRACTION IN PROGRESS... PLEASE WAIT
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-4">
              <div className="h-1 w-24 bg-gradient-to-r from-transparent to-red-600 rounded-full"></div>
              <span className="text-3xl font-mono font-black text-white w-12">{countdown}s</span>
              <div className="h-1 w-24 bg-gradient-to-l from-transparent to-red-600 rounded-full"></div>
            </div>
            <p className="text-red-500 text-xs font-bold tracking-[0.3em] uppercase animate-pulse">
              Injecting security report module
            </p>
          </div>
        </div>

        {/* Glitch overlays */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-red-500/30 animate-[glitch_2s_infinite]"></div>
        <div className="absolute bottom-1/4 right-0 w-[1px] h-32 bg-red-500/30 animate-[glitch_3s_infinite_reverse]"></div>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl border-red-500/20 bg-slate-900 shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)]">
          <CardHeader className="text-center border-b border-white/5 pb-4 pt-6">
            <div className="mx-auto mb-3 w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
              <Shield className="w-7 h-7 text-red-500" />
            </div>
            <CardTitle className="text-3xl font-black tracking-tighter text-white uppercase italic">SECURITY BREACH SIMULATED</CardTitle>
            <CardDescription className="text-slate-400 text-lg">
              Critical vulnerability detected. In a real attack, your credentials would be gone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 flex gap-4 items-start">
              <div className="mt-1"><Lock className="w-5 h-5 text-red-500" /></div>
              <p className="text-red-200/80 text-sm leading-relaxed">
                <strong className="text-red-400 font-black">EXPOSURE ALERT:</strong> You just entered sensitive credentials into an unverified page.
                Modern phishing attacks use high-end designs like the one you just saw to bypass your natural skepticism.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-red-500 uppercase tracking-widest">Personal Information Stolen:</h4>
                <div className="bg-white/5 rounded-xl p-5 space-y-3 border border-red-500/10">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-bold">Email:</span>
                    <span className="text-white font-medium">{compromisedData?.personalInfo.email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-bold">Password:</span>
                    <span className="text-red-400 font-black tracking-widest">{"*".repeat(formData.password.length)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-bold">Employee ID:</span>
                    <span className="text-white font-mono">{compromisedData?.personalInfo.employeeId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-bold">Department:</span>
                    <span className="text-white">{compromisedData?.personalInfo.department}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-bold">Access Level:</span>
                    <span className="text-blue-400 font-black">{compromisedData?.personalInfo.accessLevel}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-red-500 uppercase tracking-widest">Company Data Accessed:</h4>
                <div className="bg-white/5 rounded-xl p-5 space-y-3 border border-red-500/10">
                  <div className="flex justify-between text-sm">
                    <span className="text-white font-bold">Employee Contacts:</span>
                    <span className="text-slate-300 font-mono text-lg">{compromisedData?.companyData.contacts}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white font-bold">Documents:</span>
                    <span className="text-slate-300 font-mono text-lg">{compromisedData?.companyData.documents}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white font-bold">Financial Records:</span>
                    <span className="text-green-400 font-black uppercase tracking-tighter">Accessible</span>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="text-white font-bold text-sm uppercase tracking-tight">Systems Breached:</span>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-2 pl-2">
                      {compromisedData?.companyData.systemAccess.map((system, i) => (
                        <li key={i} className="text-xs text-slate-400 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                          {system}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-10 pt-4 border-t border-white/5">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Red flags you should have noticed:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  {[
                    "Unexpected password reset request",
                    "Urgent or threatening language",
                    "Suspicious URL or domain name",
                    "Requests for sensitive information",
                    "No verification of identity",
                    "Generic company references",
                    "Pressure to act immediately",
                    "Poor grammar or spelling"
                  ].map((flag, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                      {flag}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-green-500 uppercase tracking-widest">How to stay protected:</h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "Always verify the sender through official channels",
                    "Never click links in suspicious emails",
                    "Use multi-factor authentication on all accounts",
                    "Report suspicious emails to IT immediately",
                    "When in doubt, contact IT support directly"
                  ].map((tip, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <Button onClick={resetSimulation} variant="outline" className="flex-1 h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 text-base font-bold uppercase tracking-widest">
                Try Again
              </Button>
              <Button onClick={() => window.open("mailto:is@petrosphere.com.ph", "_blank")} className="flex-1 h-12 bg-slate-100 hover:bg-white text-slate-900 font-black border-none transition-all text-base uppercase tracking-widest">
                Report to Security Team
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }


  return (
    <div className="min-h-screen mesh-gradient flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md glass-morphism border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden">
        <CardHeader className="text-center pt-8 pb-4 px-8 text-pretty">
          <div className="mx-auto w-full flex items-center justify-center mb-6">
            <img
              src="/petros.png?v=phish"
              alt="Petrosphere Logo"
              className="w-[320px] h-auto object-contain"
            />
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-red-600 drop-shadow-sm leading-tight">
            Urgent Update! Reset Your Password Immediately
          </CardTitle>
          <CardDescription className="text-slate-600 leading-relaxed mt-2 px-2 text-sm font-medium">
            Your password has expired. Please create a new secure password to continue accessing your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.length > 0 && (
              <div className="bg-red-50/80 border border-red-100 rounded-lg p-2 space-y-1">
                {errors.map((error, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-semibold text-red-700">
                    <span>•</span> {error}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700 ml-1">Email Address</Label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-11 h-11 bg-white/50 border-slate-200 focus:bg-white focus:border-blue-400 transition-all rounded-xl text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700 ml-1">New Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-11 pr-11 h-11 bg-white/50 border-slate-200 focus:bg-white focus:border-blue-400 transition-all rounded-xl text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("password")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700 ml-1">Confirm New Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="pl-11 pr-11 h-11 bg-white/50 border-slate-200 focus:bg-white focus:border-blue-400 transition-all rounded-xl text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirmPassword")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
              <p className="font-bold mb-0.5 uppercase tracking-tight text-slate-600">Password requirements:</p>
              <ul className="list-disc list-inside space-y-0 ml-1">
                <li>At least 8 characters long</li>
                <li>Upper/lowercase letters & numbers</li>
              </ul>
            </div>

            <div className="pt-1">
              <Button type="submit" className="w-full h-11 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg shadow-slate-900/10 transition-all active:scale-[0.98]">
                Reset Password
              </Button>
            </div>

            <div className="text-center text-xs text-slate-500 font-medium pt-1">
              Need help? Contact IT Support at <a href="mailto:is@petrossphere-xyz0@hotmail.com" className="text-blue-600 hover:underline">is@petrossphere-xyz0@hotmail.com</a>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Corporate Footer */}
      <div className="mt-8 text-center space-y-4">
        <p className="text-[10px] text-slate-400 font-medium">
          © 2026 Petrosphere Inc. • Global Infrastructure Division
        </p>
      </div>
    </div>
  )
}

export default PasswordResetSimulation
