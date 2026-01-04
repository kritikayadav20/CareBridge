import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-50 selection:bg-pink-100 selection:text-pink-900">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-pink-100/50 transition-all duration-300">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-pink-400 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-pink-200">
                                C
                            </div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">CareBridge</h1>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link href="/">
                                <Button variant="ghost" className="font-medium text-slate-600 hover:text-pink-500">Home</Button>
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
            <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Soft Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-pink-100/60 rounded-full blur-[100px] opacity-60 mix-blend-multiply animate-float"></div>
                    <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-pink-50/60 rounded-full blur-[120px] opacity-60 mix-blend-multiply animate-float" style={{ animationDelay: '2s' }}></div>
                </div>

                <div className="container mx-auto px-6 relative z-10 text-center max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight animate-fade-in-up">
                        Our Mission is <span className="text-pink-500">Love & Care</span>
                    </h1>
                    <p className="text-lg text-slate-600 mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        At CareBridge, we believe that healthcare technology should be as compassionate as the care it enables. Our goal is to bridge the gap between hospitals with seamless, secure, and heartwarming technology.
                    </p>
                </div>
            </div>

            {/* Values Section */}
            <div className="container mx-auto px-6 py-20 bg-white/50 backdrop-blur-sm relative">
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    <Card className="p-8 border-t-4 border-t-pink-400 hover:shadow-xl hover:shadow-pink-100/50 transition-all">
                        <h3 className="text-xl font-bold text-slate-900 mb-3 text-pink-500">Empathy First</h3>
                        <p className="text-slate-600">We design every interaction with the patient's well-being in mind. Technology should comfort, not complicate.</p>
                    </Card>
                    <Card className="p-8 border-t-4 border-t-pink-400 hover:shadow-xl hover:shadow-pink-100/50 transition-all">
                        <h3 className="text-xl font-bold text-slate-900 mb-3 text-pink-500">Secure Connection</h3>
                        <p className="text-slate-600">Protecting patient data is our highest way of showing we care. Privacy is not a feature; it's a promise.</p>
                    </Card>
                    <Card className="p-8 border-t-4 border-t-pink-400 hover:shadow-xl hover:shadow-pink-100/50 transition-all">
                        <h3 className="text-xl font-bold text-slate-900 mb-3 text-pink-500">Seamless Innovation</h3>
                        <p className="text-slate-600">We constantly innovate to make healthcare transfers smoother, faster, and more reliable for everyone involved.</p>
                    </Card>
                </div>
            </div>

            {/* Team CTA */}
            <div className="py-24 bg-pink-50 relative overflow-hidden">
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <h2 className="text-3xl font-bold text-slate-900 mb-6">Built with <span className="text-pink-500">♥</span> by the CareBridge Team</h2>
                    <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
                        We are a dedicated team of developers, designers, and healthcare enthusiasts working together to improve patient outcomes.
                    </p>
                    <Link href="/signup">
                        <Button size="lg" className="shadow-xl shadow-pink-500/20 bg-pink-400 hover:bg-pink-500 border-none text-white">Join Our Journey</Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
