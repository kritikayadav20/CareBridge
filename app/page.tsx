import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default async function HomePage() {
  const user = await getCurrentUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-rose-100 selection:text-rose-900">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-pink-100/50 transition-all duration-300">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-pink-400 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-pink-200">
                C
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">CareBridge</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/about">
                <Button variant="ghost" className="font-medium text-slate-600 hover:text-pink-500">About</Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" className="font-medium text-slate-600 hover:text-pink-500">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button className="shadow-xl shadow-pink-500/20 bg-pink-400 hover:bg-pink-500 border-none text-white">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Soft Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-pink-100/60 rounded-full blur-[100px] opacity-60 mix-blend-multiply animate-float"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-pink-50/60 rounded-full blur-[120px] opacity-60 mix-blend-multiply animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-pink-200/40 rounded-full blur-[80px] opacity-50 mix-blend-multiply animate-float" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-50 border border-pink-100 text-pink-500 text-xs font-semibold uppercase tracking-wider mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
            </span>
            Google TechSprint 2026
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight leading-[1.1] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Healthcare with <br />
            <span className="text-pink-500 inline-block relative">
              Heart & Connection
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-pink-200 -z-10" viewBox="0 0 200 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.00025 6.99997C2.00025 6.99997 101.5 0.999995 200 4" stroke="currentColor" strokeWidth="3" /></svg>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            A secure, compassionate platform for continuous patient data transfer between hospitals.
            Because every patient story matters.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Link href="/signup">
              <Button size="lg" className="px-8 py-4 text-lg shadow-xl shadow-pink-500/20 bg-pink-400 hover:bg-pink-500 border-none">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg" className="px-8 py-4 text-lg bg-white hover:bg-slate-50 border-slate-200 text-slate-600">
                Existing User
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Cards - Soft & Trustworthy */}
      <div className="container mx-auto px-6 py-24 bg-white/50 backdrop-blur-sm relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Designed for Care</h2>
          <p className="text-slate-600">Built with privacy, empathy, and efficiency in mind.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Card 1 */}
          <Card className="text-center p-8 hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-100/50 transition-all duration-300 border-slate-100 bg-white">
            <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Secure & Private</h3>
            <p className="text-slate-500 leading-relaxed text-sm">
              End-to-end encrypted transfers with strict access controls. Your patient's privacy is our highest priority.
            </p>
          </Card>

          {/* Card 2 */}
          <Card className="text-center p-8 hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-100/50 transition-all duration-300 border-slate-100 bg-white">
            <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">AI Health Insights</h3>
            <p className="text-slate-500 leading-relaxed text-sm">
              Google Cloud Gemini provides gentle, clear summaries of health trends to assist medical professionals.
            </p>
          </Card>

          {/* Card 3 */}
          <Card className="text-center p-8 hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-100/50 transition-all duration-300 border-slate-100 bg-white">
            <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Seamless Connection</h3>
            <p className="text-slate-500 leading-relaxed text-sm">
              Instant, secure coordination between hospitals ensures that patient care is continuous and informed.
            </p>
          </Card>
        </div>

        {/* Footer/Trust */}
        <div className="mt-24 pb-12 text-center border-t border-slate-100 pt-12">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">Powered By Trusted Technology</p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-slate-400 text-sm font-medium">
            <span className="hover:text-pink-500 transition-colors">Supabase</span>
            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
            <span className="hover:text-pink-500 transition-colors">Google Cloud</span>
            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
            <span className="hover:text-pink-500 transition-colors">Next.js</span>
          </div>
        </div>
      </div>
    </div>
  )
}
