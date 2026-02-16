"use client"

import type React from "react"
import { useState, type FormEvent, type ChangeEvent, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Lock, AlertTriangle, Eye, EyeOff, Loader2, ArrowRight, Skull, Mail, CheckCircle, Smartphone, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import Script from "next/script"

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

  // New States for Fullscreen & Training
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [isTraining, setIsTraining] = useState<boolean>(false)
  const [isQuiz, setIsQuiz] = useState<boolean>(false)
  const [quizScore, setQuizScore] = useState<number>(0)
  const [showQuizResults, setShowQuizResults] = useState<boolean>(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<number>(0)
  const [pdfRendering, setPdfRendering] = useState<boolean>(false)
  const [totalPages, setTotalPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [hasReadModule, setHasReadModule] = useState<boolean>(false)

  // Load PDF.js and initialize document in background
  useEffect(() => {
    // Start loading as soon as we have results or are in training
    if ((isSubmitted || isTraining) && !pdfDoc && typeof window !== 'undefined') {
      const tryLoad = async () => {
        if (!(window as any).pdfjsLib) {
          // If lib not yet available (still loading from CDN), wait and retry
          setTimeout(tryLoad, 500)
          return
        }

        setPdfRendering(true)
        try {
          const pdfjsLib = (window as any).pdfjsLib
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

          const loadingTask = pdfjsLib.getDocument("/isms-module.dat")
          const pdf = await loadingTask.promise
          setPdfDoc(pdf)
          setTotalPages(pdf.numPages)
        } catch (error) {
          console.error("Error background loading PDF:", error)
        } finally {
          setPdfRendering(false)
        }
      }
      tryLoad()
    }
  }, [isSubmitted, isTraining, pdfDoc])

  // Render Page
  useEffect(() => {
    if (pdfDoc && isTraining) {
      const renderPage = async () => {
        const container = document.getElementById('pdf-container')
        const canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement
        if (!canvas || !container) return

        const page = await pdfDoc.getPage(currentPage)

        // Calculate dynamic scale to fit width
        const containerWidth = container.clientWidth - 64 // 32px padding on each side
        const unscaledViewport = page.getViewport({ scale: 1 })
        const scale = containerWidth / unscaledViewport.width

        const viewport = page.getViewport({ scale: Math.min(scale, 2) }) // Cap zoom at 2x for quality
        const context = canvas.getContext('2d')

        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        }
        await page.render(renderContext).promise
      }

      renderPage()

      // Add resize observer for responsiveness
      const container = document.getElementById('pdf-container')
      if (container) {
        const resizeObserver = new ResizeObserver(() => {
          renderPage()
        })
        resizeObserver.observe(container)
        return () => resizeObserver.disconnect()
      }
    }
  }, [pdfDoc, currentPage, isTraining])

  // Fullscreen Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Visitor Tracking
  useEffect(() => {
    const trackVisitor = async () => {
      try {
        await fetch("/api/log-visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

  // Track module completion
  useEffect(() => {
    if (currentPage === totalPages && totalPages > 0) {
      setHasReadModule(true)
    }
  }, [currentPage, totalPages])

  // Countdown Timer for Skull Screen
  useEffect(() => {
    if (showTwist && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (showTwist && countdown === 0) {
      setShowTwist(false)
      setIsSubmitted(true)
    }
  }, [showTwist, countdown])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateForm = (): string[] => {
    const newErrors: string[] = []
    if (!formData.email) newErrors.push("Email is required")
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.push("Please enter a valid email address")
    if (!formData.password) newErrors.push("Password is required")
    else if (formData.password.length < 8) newErrors.push("Password must be at least 8 characters")
    if (!formData.confirmPassword) newErrors.push("Please confirm your password")
    else if (formData.password !== formData.confirmPassword) newErrors.push("Passwords do not match")
    return newErrors
  }

  const enterFullscreen = () => {
    const elem = document.documentElement
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => console.error("Fullscreen error:", err))
    }
  }

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => console.error("Exit fullscreen error:", err))
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    const validationErrors = validateForm()
    setErrors(validationErrors)

    if (validationErrors.length === 0) {
      setIsLoading(true)
      enterFullscreen()

      // Log the failure
      fetch("/api/log-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "simulation_failure", email: formData.email }),
      }).catch((err) => console.error("Logging failed", err))

      // Simulate loading
      for (let i = 1; i <= 5; i++) {
        setProgressStep(i)
        await new Promise((resolve) => setTimeout(resolve, 800))
      }

      setCompromisedData({
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
          systemAccess: ["Email Server", "File Server", "Database", "Client Information"],
          financialRecords: "Accessible",
        },
        networkInfo: {
          ipAddress: "192.168.1." + Math.floor(Math.random() * 255),
          location: "Office Network",
          connectedDevices: Math.floor(Math.random() * 20) + 5,
        },
      })
      setIsLoading(false)
      setShowTwist(true)
      setCountdown(5)
    }
  }

  const resetSimulation = (): void => {
    setFormData({ email: "", password: "", confirmPassword: "" })
    setIsSubmitted(false)
    setShowTwist(false)
    setIsTraining(false)
    setIsQuiz(false)
    setQuizScore(0)
    setShowQuizResults(false)
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setErrors([])
    exitFullscreen()
  }

  // RENDER LOGIC

  // 1. Fullscreen Lock Overlay (Highest Priority)
  if ((showTwist || isSubmitted || isTraining || isQuiz) && !isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-red-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-600/20 via-black to-black"></div>
        <div className="relative z-10 space-y-8 max-w-lg">
          <div className="absolute inset-0 bg-red-600 rounded-full blur-2xl opacity-40 animate-pulse"></div>
          <div className="relative bg-black border-2 border-red-600 rounded-full w-full h-full flex items-center justify-center">
            <Lock className="w-10 h-10 text-red-600" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Security Breach Detected</h2>
            <p className="text-red-400 font-mono text-sm leading-relaxed">
              ATTEMPTED SESSION TERMINATION DETECTED. SYSTEM LOCK ENGAGED TO PROTECT ENCRYPTED DATA STREAMS.
              RE-AUTHORIZE VIEWING TO PROCEED WITH DATA ANALYSIS.
            </p>
          </div>
          <Button onClick={enterFullscreen} className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black text-lg uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all active:scale-95">
            Re-Authorize System Lock
          </Button>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold">Unauthorized exit is a violation of security protocol #4412</p>
        </div>
      </div>
    )
  }

  // 2. Quiz Screen (Microsoft Forms Integration)
  if (isQuiz) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-5xl h-[90vh] border-white/10 bg-slate-900 shadow-2xl overflow-hidden flex flex-col relative">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600/20 rounded-xl flex items-center justify-center border border-green-500/30">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-white uppercase italic tracking-tight">Knowledge Assessment</CardTitle>
                <CardDescription className="text-xs text-slate-500 font-mono uppercase tracking-widest">Complete the final security check</CardDescription>
              </div>
            </div>
            <Button onClick={resetSimulation} className="h-10 bg-red-600 hover:bg-red-500 text-white font-black px-6 uppercase tracking-widest rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all active:scale-95">
              Finish Simulation
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0 bg-white">
            <iframe
              src="https://forms.office.com/Pages/ResponsePage.aspx?id=F_Kp2AkiyEKmgTRAhPH_RCdi4OHcJotLtzVv6pCjK4dUNzZKRU1XWkROVDNYVEY0RjY4OVdOWlM0Ti4u&embed=true"
              className="w-full h-full border-none"
              title="Security Awareness Quiz"
              allowFullScreen
            />
          </CardContent>
          <div className="p-3 bg-slate-900 border-t border-white/5 text-center">
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">Submit your responses in the form above and click "Finish Simulation" to logout</p>
          </div>
        </Card>
      </div>
    )
  }

  // 3. Training Screen (Custom Canvas Module)
  if (isTraining) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-5xl h-[90vh] border-white/10 bg-slate-900 shadow-2xl overflow-hidden flex flex-col relative">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                <Shield className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-white uppercase italic tracking-tight">Security Awareness Module</CardTitle>
                <CardDescription className="text-xs text-slate-500 font-mono uppercase">ISMS & Cybersecurity Fundamentals</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/10 mr-4">
                <Button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-xs font-mono text-slate-400">Page {currentPage} of {totalPages || '--'}</span>
                <Button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={() => setIsQuiz(true)}
                disabled={!hasReadModule}
                className={`h-10 font-black px-6 uppercase tracking-widest rounded-xl transition-all duration-300 ${hasReadModule
                  ? "bg-green-600 hover:bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                  : "bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed opacity-50"
                  }`}
              >
                {hasReadModule ? "Take the Quiz" : "Read to Unlock"}
              </Button>
            </div>
          </CardHeader>
          <CardContent id="pdf-container" className="flex-1 p-0 bg-slate-950 relative overflow-auto flex justify-center">
            {pdfDoc ? (
              <div className="p-8">
                <canvas id="pdf-canvas" className="shadow-2xl mx-auto border border-white/10" />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">
                    {pdfRendering ? "Rendering Presentation..." : "Initializing Security Viewer..."}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <div className="p-4 bg-slate-900 border-t border-white/5 text-center px-4">
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">Browsing interactive slide {currentPage} / {totalPages}. Use the arrows to navigate.</p>
          </div>
        </Card>
      </div>
    )
  }

  // 4. Results Screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-y-auto">
        <Card className="w-full max-w-4xl border-red-500/20 bg-slate-900 shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)] my-8">
          <CardHeader className="text-center border-b border-white/5 pb-4 pt-6">
            <div className="mx-auto mb-3 w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
              <Shield className="w-7 h-7 text-red-500" />
            </div>
            <CardTitle className="text-3xl font-black tracking-tighter text-white uppercase italic">SECURITY BREACH SIMULATED</CardTitle>
            <CardDescription className="text-slate-400 text-lg">Critical vulnerability detected. In a real attack, your credentials would be gone.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 flex gap-4 items-start">
              <div className="mt-1"><Lock className="w-5 h-5 text-red-500" /></div>
              <p className="text-red-200/80 text-sm leading-relaxed">
                <strong className="text-red-400 font-black">EXPOSURE ALERT:</strong> You just entered sensitive credentials into an unverified page.
                Modern phishing attacks use high-end designs to bypass your natural skepticism.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-red-500 uppercase tracking-widest">Personal Information Stolen:</h4>
                <div className="bg-white/5 rounded-xl p-5 space-y-3 border border-red-500/10 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Email:</span>
                    <span className="text-white">{compromisedData?.personalInfo.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Password:</span>
                    <span className="text-red-400 font-black tracking-widest">{"*".repeat(formData.password.length)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Employee ID:</span>
                    <span className="text-white font-mono">{compromisedData?.personalInfo.employeeId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Department:</span>
                    <span className="text-white">{compromisedData?.personalInfo.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Access Level:</span>
                    <span className="text-blue-400 font-black">{compromisedData?.personalInfo.accessLevel}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-red-500 uppercase tracking-widest">Company Data Accessed:</h4>
                <div className="bg-white/5 rounded-xl p-5 space-y-3 border border-red-500/10 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white font-bold">Contacts:</span>
                    <span className="text-slate-300 font-mono text-lg">{compromisedData?.companyData.contacts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white font-bold">Documents:</span>
                    <span className="text-slate-300 font-mono text-lg">{compromisedData?.companyData.documents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white font-bold">Financials:</span>
                    <span className="text-green-400 font-black">ACCESSIBLE</span>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="text-white font-bold text-xs uppercase tracking-tight">Systems Breached:</span>
                    <ul className="grid grid-cols-1 gap-1 pl-2">
                      {compromisedData?.companyData.systemAccess.map((system, i) => (
                        <li key={i} className="text-[10px] text-slate-400 flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-red-500"></div>
                          {system}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Red flags you should have noticed:</h4>
                <div className="grid grid-cols-1 gap-1">
                  {[
                    "Unexpected password reset request",
                    "Urgent or threatening language",
                    "Suspicious URL or domain name",
                    "Requests for sensitive information",
                    "Generic company references",
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
                <div className="grid grid-cols-1 gap-1">
                  {[
                    "Always verify the sender via official channels",
                    "Never click links in suspicious emails",
                    "Use multi-factor authentication (MFA)",
                    "Report suspicious emails to IT immediately",
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
              <Button onClick={resetSimulation} variant="outline" className="flex-1 h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 text-base font-bold uppercase tracking-widest">Try Again</Button>
              <Button onClick={() => setIsTraining(true)} className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white font-black text-base uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.3)]">Start Security Training</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 5. Loading Screen
  if (isLoading) {
    const progressMessages = ["Authenticating session...", "Syncing with directory...", "Validating permissions...", "Updating certificates...", "Finalizing sync..."]
    return (
      <div className="min-h-screen mesh-gradient flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-morphism border-none shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-6 w-16 h-16 bg-blue-50/50 rounded-2xl flex items-center justify-center border border-blue-100/50"><Lock className="w-8 h-8 text-blue-600 animate-pulse" /></div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">Secure Processing</CardTitle>
            <CardDescription className="text-slate-500">Establishing encrypted connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-8">
            <div className="space-y-4">
              <div className="w-full bg-slate-200/50 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-600 h-full transition-all duration-700" style={{ width: `${(progressStep / 5) * 100}%` }}></div>
              </div>
              <p className="text-center text-sm font-medium text-slate-600 animate-pulse">{progressMessages[progressStep - 1] || "Initializing..."}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 6. Skull / Twisted Screen
  if (showTwist) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent opacity-20"></div>
        <div className="text-center space-y-8 relative z-10 animate-in fade-in zoom-in duration-700">
          <div className="relative mx-auto w-32 h-32">
            <div className="absolute inset-0 bg-red-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
            <div className="relative bg-red-950/30 border-2 border-red-500/50 rounded-full w-full h-full flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.3)]"><Skull className="w-16 h-16 text-red-500" /></div>
          </div>
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">YOU'VE BEEN <span className="text-red-600">HACKED!</span></h1>
            <p className="text-xl text-slate-400 font-medium tracking-[0.2em] font-mono leading-none">SYSTEM VULNERABILITY EXPLOITED</p>
          </div>
          <div className="max-w-xl mx-auto">
            <div className="bg-red-950/20 border border-red-500/20 p-8 rounded-3xl backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>
              <p className="text-red-200 text-2xl font-bold italic leading-relaxed mb-4">"Why did the hacker get lost? Because he couldn't find the 'backdoor'!"</p>
              <div className="text-slate-500 font-mono text-sm border-t border-red-500/10 pt-4">DATA EXTRACTION IN PROGRESS... PLEASE WAIT</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-4">
              <div className="h-1 w-24 bg-gradient-to-r from-transparent to-red-600 rounded-full"></div>
              <span className="text-3xl font-mono font-black text-white w-12">{countdown}s</span>
              <div className="h-1 w-24 bg-gradient-to-l from-transparent to-red-600 rounded-full"></div>
            </div>
            <p className="text-red-500 text-xs font-bold tracking-[0.3em] uppercase animate-pulse">Injecting security report module</p>
          </div>
        </div>
      </div>
    )
  }

  // 7. Initial Form (Default)
  return (
    <div className="min-h-screen mesh-gradient flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md glass-morphism border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden">
        <CardHeader className="text-center pt-8 pb-4 px-8">
          <div className="mx-auto w-full flex items-center justify-center mb-6">
            <img src="/petros.png?v=phish" alt="Petrosphere Logo" className="w-[320px] h-auto object-contain" />
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-red-600 drop-shadow-sm leading-tight">Urgent Update! Reset Your Password Immediately</CardTitle>
          <CardDescription className="text-slate-600 leading-relaxed mt-2 text-sm font-medium px-2">Your password has expired. Please create a new secure password to continue accessing your account.</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.length > 0 && (
              <div className="bg-red-50/80 border border-red-100 rounded-lg p-2 space-y-1">
                {errors.map((error, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-semibold text-red-700"><span>•</span> {error}</div>
                ))}
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700 ml-1">Email Address</Label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <Input id="email" name="email" type="email" placeholder="Enter your email address" value={formData.email} onChange={handleInputChange} className="pl-11 h-11 bg-white/50 border-slate-200 focus:bg-white focus:border-blue-400 transition-all rounded-xl text-sm" required />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700 ml-1">New Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Enter new password" value={formData.password} onChange={handleInputChange} className="pl-11 pr-11 h-11 bg-white/50 border-slate-200 focus:bg-white focus:border-blue-400 transition-all rounded-xl text-sm" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><Eye className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700 ml-1">Confirm New Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm new password" value={formData.confirmPassword} onChange={handleInputChange} className="pl-11 pr-11 h-11 bg-white/50 border-slate-200 focus:bg-white focus:border-blue-400 transition-all rounded-xl text-sm" required />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><Eye className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="pt-2">
              <Button type="submit" className="w-full h-11 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]">Reset Password</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="mt-8 text-center"><p className="text-[10px] text-slate-400 font-medium">© 2026 Petrosphere Inc. • Global Infrastructure Division</p></div>
    </div>
  )
}

export default PasswordResetSimulation
