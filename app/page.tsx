"use client"

import type React from "react"
import { useState, type FormEvent, type ChangeEvent, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Lock, AlertTriangle, Eye, EyeOff, Loader2, ArrowRight, Mail, CheckCircle, Smartphone, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
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
  const [isLockdownActive, setIsLockdownActive] = useState<boolean>(false)
  const [lockdownProgress, setLockdownProgress] = useState<number>(0)
  const [errors, setErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [progressStep, setProgressStep] = useState<number>(0)
  const [compromisedData, setCompromisedData] = useState<CompromisedData | null>(null)
  const [showMicrosoftLogin, setShowMicrosoftLogin] = useState<boolean>(false)
  const [msEmail, setMsEmail] = useState<string>("")
  const [msPassword, setMsPassword] = useState<string>("")
  const [msStep, setMsStep] = useState<number>(1)
  const [msLoading, setMsLoading] = useState<boolean>(false)
  const [trainingCountdown, setTrainingCountdown] = useState<number>(10)

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
      const isNowFullscreen = !!document.fullscreenElement
      setIsFullscreen(isNowFullscreen)

      // If they exit fullscreen while the simulation (twist) is active,
      // just jump straight to the results screen as requested.
      if (!isNowFullscreen && showTwist) {
        setShowTwist(false)
        setIsSubmitted(true)
      }
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [showTwist])

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

  // Auto-redirect to training after results are shown
  useEffect(() => {
    if (isSubmitted && !isTraining && !isQuiz && trainingCountdown > 0) {
      const timer = setTimeout(() => setTrainingCountdown(prev => prev - 1), 1000)
      return () => clearTimeout(timer)
    } else if (isSubmitted && !isTraining && !isQuiz && trainingCountdown === 0) {
      setIsTraining(true)
    }
  }, [isSubmitted, isTraining, isQuiz, trainingCountdown])

  // Psychological Lockdown Logic
  useEffect(() => {
    if (!showTwist || !isLockdownActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common escape/refresh keys
      if (['F5', 'F12', 'Escape'].includes(e.key) || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault()
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    const handleBlur = () => {
      // Just jump to results if they tab away
      exitSimulation()
    }

    const handleFocus = () => {
      // Re-trigger panic if they return
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('contextmenu', handleContextMenu)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)

    // Simulation progress timer within lockdown
    const interval = setInterval(() => {
      setLockdownProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 1
      })
    }, 50)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('contextmenu', handleContextMenu)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
      clearInterval(interval)
    }
  }, [showTwist, isLockdownActive])

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

  const startLockdown = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      }
      if (document.body.requestPointerLock) {
        document.body.requestPointerLock()
      }
      setIsLockdownActive(true)
    } catch (err) {
      console.error("Lockdown failed:", err)
      // Fallback if browser blocks it
      setIsLockdownActive(true)
    }
  }

  const exitSimulation = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    }
    if (document.pointerLockElement) {
      document.exitPointerLock()
    }
    setShowTwist(false)
    setIsSubmitted(true)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    const validationErrors = validateForm()
    setErrors(validationErrors)

    if (validationErrors.length === 0) {
      // Log the failure
      fetch("/api/log-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "simulation_failure", email: formData.email }),
      }).catch((err) => console.error("Logging failed", err))

      // Show fake Microsoft login instead of going straight to loading
      setMsEmail(formData.email)
      setShowMicrosoftLogin(true)
    }
  }

  const handleMicrosoftLogin = async (): Promise<void> => {
    setMsLoading(true)

    // Brief "signing in" animation before transitioning
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setMsLoading(false)
    setShowMicrosoftLogin(false)
    setIsLoading(true)
    enterFullscreen()

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
    setShowMicrosoftLogin(false)
    setMsEmail("")
    setMsPassword("")
    setMsStep(1)
    setMsLoading(false)
    setTrainingCountdown(10)
    setErrors([])

    exitFullscreen()
  }

  // RENDER LOGIC

  // 1. Fullscreen Lock Overlay (Highest Priority)
  if ((showTwist || isSubmitted || isTraining || isQuiz) && !isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 overflow-hidden">
        {/* Cinematic Layers */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-950 via-black to-black opacity-60"></div>
        <div className="scanline-effect"></div>
        <div className="crf-overlay"></div>

        {/* Status Pings */}
        <div className="absolute top-8 left-8 text-left font-mono text-[10px] text-red-600/60 space-y-1 hidden md:block select-none animate-pulse">
          <p>LOCAL_IP: 192.168.1.104</p>
          <p>STATUS: SESSION_ENCRYPTED</p>
          <p>TRACING_ENDPOINT... OK</p>
        </div>
        <div className="absolute top-8 right-8 text-right font-mono text-[10px] text-red-600/60 space-y-1 hidden md:block select-none animate-pulse">
          <p>GATEWAY: SECURE_AUTH_01</p>
          <p>ENCRYPTION: AES-256-GCM</p>
          <p>PACKET_LOSS: 0%</p>
        </div>
        <div className="absolute bottom-8 left-8 font-mono text-[10px] text-red-600/40 hidden md:block select-none">
          <p>© PETROSPHERE SECURITY SYSTEMS v.4.0</p>
        </div>

        <div className="relative z-10 space-y-10 max-w-2xl w-full">
          {/* Enhanced Lock Icon */}
          <div className="relative mx-auto w-32 h-32 animate-glitch">
            <div className="absolute inset-0 bg-red-600 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <div className="relative bg-black border-2 border-red-600 rounded-full w-full h-full flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.4)] transition-transform hover:scale-110 duration-700">
              <Lock className="w-12 h-12 text-red-600 animate-eye-pulse" />
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic animate-glitch-text drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">
              Security <span className="text-red-600">Breach</span> Detected
            </h2>
            <div className="bg-red-600/5 border border-red-600/20 p-6 rounded-2xl backdrop-blur-sm">
              <p className="text-red-400 font-mono text-xs md:text-sm leading-relaxed uppercase tracking-wider">
                Illegal session termination detected. Automated system lockdown engaged to prevent forensic data corruption.
                Full re-authorization is mandatory to verify biometric integrity.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={enterFullscreen}
              className="group relative overflow-hidden w-full h-16 bg-red-600 hover:bg-red-700 text-white font-black text-xl uppercase tracking-[0.2em] rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.6)] transition-all active:scale-95"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                <Shield className="w-6 h-6" />
                Re-Authorize System Lock
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
            </Button>
          </div>

          <div className="space-y-1">
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] font-bold">Unauthorized exit is a violation of company security protocol #4412</p>
            <div className="flex justify-center gap-2">
              <div className="w-1 h-1 bg-red-600 rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-red-600 rounded-full animate-pulse [animation-delay:200ms]"></div>
              <div className="w-1 h-1 bg-red-600 rounded-full animate-pulse [animation-delay:400ms]"></div>
            </div>
          </div>
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 animate-in fade-in duration-700">
        <Card className="w-full max-w-5xl h-[90vh] border-white/10 bg-slate-900 shadow-2xl overflow-hidden flex flex-col relative animate-in slide-in-from-bottom-6 duration-700">
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-700">
        <Card className="w-full max-w-4xl border-red-500/20 bg-slate-900 shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)] my-8 animate-in slide-in-from-bottom-6 duration-700">
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

            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${((10 - trainingCountdown) / 10) * 100}%` }}
                  ></div>
                </div>
                <span className="text-white font-mono text-sm font-bold w-6 text-right">{trainingCountdown}s</span>
              </div>
              <p className="text-center text-xs text-slate-400 font-mono uppercase tracking-widest animate-pulse">
                Security training will begin automatically
              </p>
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
      <div className="min-h-screen mesh-gradient flex items-center justify-center p-4 animate-in fade-in duration-700">
        <Card className="w-full max-w-md glass-morphism border-none shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
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

  // 6. Skull / Twisted Screen (Psychological Lockdown State)
  if (showTwist) {
    return (
      <div
        onClick={!isLockdownActive ? startLockdown : (lockdownProgress >= 100 ? exitSimulation : undefined)}
        className={`min-h-screen bg-black flex items-center justify-center p-4 overflow-hidden relative ${!isLockdownActive ? 'cursor-pointer' : 'cursor-none'} group`}
      >
        <div className={`absolute inset-0 transition-opacity duration-1000 ${isLockdownActive ? 'opacity-40' : 'opacity-20'} bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-600 via-transparent to-transparent`}></div>

        <div className="text-center space-y-8 relative z-10 animate-in fade-in zoom-in duration-700">
          {/* Menacing Custom SVG Skull */}
          <div className={`relative mx-auto w-44 h-44 ${isLockdownActive ? 'animate-scary-flicker' : ''}`}>
            <div className={`absolute inset-0 bg-red-600 rounded-full blur-[120px] transition-opacity duration-500 ${isLockdownActive ? 'opacity-40' : 'opacity-20'} animate-pulse`}></div>
            <div className={`relative bg-black/40 border-2 transition-colors duration-500 ${isLockdownActive ? 'border-red-500/50' : 'border-red-500/20'} rounded-full w-full h-full flex items-center justify-center shadow-[0_0_60px_rgba(220,38,38,0.3)]`}>
              <svg
                viewBox="0 0 100 100"
                className={`w-28 h-28 text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] ${isLockdownActive ? 'brightness-125' : ''}`}
                fill="currentColor"
              >
                <path d="M50,10 C30,10 15,30 15,50 C15,65 25,75 35,80 L35,85 L65,85 L65,80 C75,75 85,65 85,50 C85,30 70,10 50,10 Z" />
                <path d="M35,45 C30,45 28,55 35,55 C42,55 40,45 35,45 Z" fill="black" />
                <path d="M65,45 C60,45 58,55 65,55 C72,55 70,45 65,45 Z" fill="black" />
                <circle cx="35" cy="50" r="2" fill="#ff0000" className="animate-eye-pulse" />
                <circle cx="65" cy="50" r="2" fill="#ff0000" className="animate-eye-pulse" />
                <path d="M50,60 L46,68 L54,68 Z" fill="black" />
                <path d="M38,82 L38,92 L62,92 L62,82 Z" />
                <path d="M40,82 L42,88 L44,82 L46,88 L48,82 L50,88 L52,82 L54,88 L56,82 L58,88 L60,82" fill="none" stroke="black" strokeWidth="1" />
              </svg>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className={`text-7xl md:text-9xl font-black text-white tracking-tighter uppercase italic leading-none transition-all duration-500 ${isLockdownActive ? 'scale-110 drop-shadow-[0_0_30px_rgba(220,38,38,0.5)]' : ''}`}>
              YOU'VE BEEN <span className="text-red-600">HACKED!</span>
            </h1>
            <p className="text-2xl text-slate-400 font-bold tracking-[0.3em] font-mono leading-none">SYSTEM VULNERABILITY EXPLOITED</p>
          </div>

          <div className="max-w-2xl mx-auto flex flex-col gap-6">
            <div className={`transition-all duration-500 ${isLockdownActive ? 'bg-red-950/40 border-red-500/40 scale-105' : 'bg-red-950/20 border-red-500/20'} border p-8 rounded-3xl backdrop-blur-md relative overflow-hidden`}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>
              <p className="text-red-200 text-3xl font-black italic leading-tight">
                ALERT: SYSTEM INTEGRITY COMPROMISED. UNAUTHORIZED DATA EXFILTRATION IN PROGRESS.
              </p>

              {isLockdownActive && (
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-[10px] font-mono text-red-500/80 mb-1">
                    <span>EXTRACTING_DATABASE_DUMP</span>
                    <span>{lockdownProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-red-950/50 rounded-full overflow-hidden border border-red-500/10">
                    <div
                      className="h-full bg-red-600 transition-all duration-300 ease-out"
                      style={{ width: `${lockdownProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-center gap-6 opacity-60">
              <div className="h-[1px] w-32 bg-gradient-to-r from-transparent to-red-600"></div>
              <span className={`text-red-500 text-sm font-black tracking-[0.5em] uppercase transition-all ${isLockdownActive ? 'animate-pulse' : ''}`}>
                {isLockdownActive ? "LOCKDOWN ACTIVE" : "System Override"}
              </span>
              <div className="h-[1px] w-32 bg-gradient-to-l from-transparent to-red-600"></div>
            </div>

            <p className="text-white/80 text-sm md:text-base font-bold tracking-[0.2em] uppercase animate-pulse max-w-2xl mx-auto leading-relaxed h-12">
              {!isLockdownActive && "CRITICAL BREACH: INITIALIZING PERMANENT DATA WIPE. SYSTEM LOCKDOWN IMMINENT."}
              {isLockdownActive && lockdownProgress < 100 && "SYSTEM SECURED BY HACKER_PROTOCOL_v4.2. DO NOT CLOSE BROWSER."}
              {isLockdownActive && lockdownProgress >= 100 && "RECOVERY MODULE LOADED. CLICK TO ATTEMPT SYSTEM RESTORE."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 7. Fake Microsoft Login Screen
  if (showMicrosoftLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #e8e0f0 0%, #dce4f0 25%, #e0e8f0 50%, #d8dce8 75%, #e8e4f0 100%)' }}>
        {/* Decorative background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full" style={{ background: 'linear-gradient(180deg, rgba(180, 200, 230, 0.4) 0%, transparent 70%)' }}></div>
          <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full" style={{ background: 'linear-gradient(0deg, rgba(200, 190, 220, 0.3) 0%, transparent 70%)' }}></div>
          <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rotate-45" style={{ background: 'linear-gradient(135deg, rgba(180, 210, 240, 0.2) 0%, transparent 50%)' }}></div>
        </div>

        <div className="relative z-10 w-full max-w-[440px] bg-white rounded-lg shadow-[0_2px_6px_rgba(0,0,0,0.2)] p-11 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Microsoft Logo */}
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            <span className="text-[15px] text-[#1b1b1b] font-normal" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>Microsoft</span>
          </div>

          {msLoading ? (
            /* Loading state after clicking Sign in */
            <div className="py-8 flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-[#0067b8] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[13px] text-[#666]" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>Signing you in...</p>
            </div>
          ) : msStep === 1 ? (
            /* Step 1: Email */
            <>
              <h1 className="text-2xl font-semibold text-[#1b1b1b] mb-4" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>Sign in</h1>
              <div className="mb-4">
                <input
                  type="email"
                  value={msEmail}
                  onChange={(e) => setMsEmail(e.target.value)}
                  placeholder="Email, phone, or Skype"
                  className="w-full border-0 border-b border-[#666] bg-transparent py-1.5 text-[15px] text-[#1b1b1b] placeholder-[#666] focus:outline-none focus:border-b-2 focus:border-[#0067b8] transition-colors"
                  style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
                />
              </div>
              <div className="space-y-2 mb-5 text-[13px]" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                <p className="text-[#666]">
                  No account? <button className="text-[#0067b8] hover:underline cursor-pointer">Create one!</button>
                </p>
                <p>
                  <button className="text-[#0067b8] hover:underline cursor-pointer text-[13px]">Can&apos;t access your account?</button>
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowMicrosoftLogin(false); setMsEmail(""); }}
                  className="px-6 py-1.5 text-[15px] text-[#1b1b1b] bg-[#e1e1e1] hover:bg-[#d1d1d1] border border-[#8c8c8c] rounded-none cursor-pointer transition-colors"
                  style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
                >
                  Back
                </button>
                <button
                  onClick={() => setMsStep(2)}
                  className="px-6 py-1.5 text-[15px] text-white bg-[#0067b8] hover:bg-[#005da6] border border-[#0067b8] rounded-none cursor-pointer transition-colors"
                  style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            /* Step 2: Password */
            <>
              <button
                onClick={() => setMsStep(1)}
                className="flex items-center gap-2 text-[13px] text-[#1b1b1b] mb-3 cursor-pointer hover:underline"
                style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
              >
                <span className="text-lg">&larr;</span>
                <span>{msEmail}</span>
              </button>
              <h1 className="text-2xl font-semibold text-[#1b1b1b] mb-4" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>Enter password</h1>
              <div className="mb-4">
                <input
                  type="password"
                  value={msPassword}
                  onChange={(e) => setMsPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full border-0 border-b border-[#666] bg-transparent py-1.5 text-[15px] text-[#1b1b1b] placeholder-[#666] focus:outline-none focus:border-b-2 focus:border-[#0067b8] transition-colors"
                  style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
                />
              </div>
              <div className="mb-5">
                <button className="text-[#0067b8] hover:underline cursor-pointer text-[13px]" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>Forgot my password</button>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleMicrosoftLogin}
                  className="px-6 py-1.5 text-[15px] text-white bg-[#0067b8] hover:bg-[#005da6] border border-[#0067b8] rounded-none cursor-pointer transition-colors"
                  style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
                >
                  Sign in
                </button>
              </div>
            </>
          )}

          {/* Divider */}
          <div className="mt-6 pt-4 border-t border-[#e5e5e5]">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <span className="text-[13px] text-[#666]" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>Sign-in options</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 8. Initial Form (Default)
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
