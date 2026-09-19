'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Radar, Users, Route, Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Home() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && userRole) {
      router.push('/dashboard');
    }
  }, [user, userRole, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-surface-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (user && userRole) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="border-b border-surface-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-surface-900 tracking-tight">TalentSync AI</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-in">
            <div className="badge-primary mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="ml-1">Internal Talent Intelligence</span>
            </div>
            <h1 className="text-5xl font-extrabold text-surface-900 tracking-tight leading-tight">
              Discover the talent <br />
              <span className="text-primary-600">already inside</span><br />
              your organization.
            </h1>
            <p className="mt-6 text-lg text-surface-500 leading-relaxed max-w-lg">
              Most HR systems ask &ldquo;Who matches this job?&rdquo;
              <br />
              TalentSync AI asks: <strong className="text-surface-700">&ldquo;What capabilities already exist, where are they hidden, and how can we mobilize them?&rdquo;</strong>
            </p>
            
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-surface-200">
                <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Radar className="w-4.5 h-4.5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900">Hidden Talent Radar</p>
                  <p className="text-xs text-surface-500 mt-0.5">Surface capabilities titles don&apos;t reveal</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-surface-200">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Route className="w-4.5 h-4.5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900">Career Pathfinder</p>
                  <p className="text-xs text-surface-500 mt-0.5">Actionable development roadmaps</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-surface-200">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900">Internal Mobility</p>
                  <p className="text-xs text-surface-500 mt-0.5">Match talent to opportunities</p>
                </div>
              </div>
            </div>
          </div>

          {/* Auth Form */}
          <AuthForm />
        </div>
      </section>

      {/* Visual language */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-surface-200">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-surface-900">How TalentSync AI Works</h2>
          <p className="text-surface-500 mt-2">From hidden capabilities to actionable internal mobility</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          {['Employee Profile', 'Capability Analysis', 'Hidden Talents', 'Skill Adjacency', 'Career Path', 'Internal Mobility'].map((step, i) => (
            <div key={step} className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-surface-200 shadow-sm">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  i < 2 ? 'bg-primary-500' : i < 4 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}>
                  {i + 1}
                </div>
                <span className="font-medium text-surface-700">{step}</span>
              </div>
              {i < 5 && <ArrowRight className="w-4 h-4 text-surface-300 hidden sm:block" />}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'employee' | 'hr'>('employee');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signUp, signIn } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          toast.error('Please enter your full name');
          setSubmitting(false);
          return;
        }
        const { error } = await signUp(email, password, role, fullName);
        if (error) {
          if (error.message?.toLowerCase().includes('rate limit') || error.message?.toLowerCase().includes('email')) {
            toast.error('Email limit reached: Disable "Confirm email" in Supabase Auth settings to sign up instantly.');
          } else {
            toast.error(error.message || 'Sign up failed');
          }
        } else {
          toast.success('Account created! Redirecting...');
          router.push('/dashboard');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message || 'Sign in failed');
        } else {
          toast.success('Welcome back!');
          router.push('/dashboard');
        }
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-8 max-w-md mx-auto lg:mx-0 lg:ml-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-surface-900">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="text-sm text-surface-500 mt-1">
          {isSignUp ? 'Start discovering hidden talent' : 'Sign in to your talent intelligence platform'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <>
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('employee')}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    role === 'employee'
                      ? 'border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-200'
                      : 'border-surface-200 text-surface-600 hover:border-surface-300'
                  }`}
                >
                  <Users className="w-4 h-4 mx-auto mb-1" />
                  Employee
                </button>
                <button
                  type="button"
                  onClick={() => setRole('hr')}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    role === 'hr'
                      ? 'border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-200'
                      : 'border-surface-200 text-surface-600 hover:border-surface-300'
                  }`}
                >
                  <Radar className="w-4 h-4 mx-auto mb-1" />
                  HR / Talent Manager
                </button>
              </div>
            </div>
          </>
        )}

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input-field"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-field pr-10"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {isSignUp ? 'Create Account' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
