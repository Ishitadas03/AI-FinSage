import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export const ContactPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Please enter your name.';
    if (!formData.email.trim() || !formData.email.includes('@')) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!formData.subject.trim()) errs.subject = 'Please specify a subject.';
    if (!formData.message.trim() || formData.message.length < 10) {
      errs.message = 'Message must be at least 10 characters.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast.success('Thank you! Your message has been received.');
    }, 600);
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* Header */}
      <section className="relative overflow-hidden pt-12 pb-14 lg:pt-16 lg:pb-16 border-b border-slate-200/80 bg-gradient-to-b from-white via-teal-50/20 to-[#F8FAFA]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1 text-xs font-bold text-teal-800">
            <MessageSquare className="h-3.5 w-3.5 text-teal-600" />
            <span>Support & Inquiries</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Contact FinSage Support
          </h1>

          <p className="mx-auto max-w-xl text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Have a feature request, bug report, or inquiry about platform capabilities? Send us a message and our team will get in touch.
          </p>
        </div>
      </section>

      {/* Main Body */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left: Info & Trust */}
          <div className="md:col-span-5 space-y-6">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900">How We Assist You</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                We review technical feedback, calculation verifications, and onboarding queries directly to ensure the FinSage engine stays accurate and reliable.
              </p>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800">Response Turnaround:</strong>
                    <div className="text-slate-500 text-[11px]">Typically within 24 to 48 business hours.</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800">Direct Privacy:</strong>
                    <div className="text-slate-500 text-[11px]">Messages are securely stored and never shared with advertisers.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-teal-50/80 p-5 border border-teal-200/80 text-xs text-teal-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-teal-700" />
                <span>Looking for immediate answers?</span>
              </div>
              <p className="text-[11px] text-teal-800">
                Check our documentation in the <a href="/help" className="underline font-bold">Help Center</a> or read our <a href="/faq" className="underline font-bold">FAQ</a>.
              </p>
            </div>
          </div>

          {/* Right: Validated Form */}
          <div className="md:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
            {submitted ? (
              <div className="py-8 text-center space-y-4 animate-in fade-in-0">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 border border-teal-200">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Message Successfully Sent!</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Thank you, <strong>{formData.name}</strong>. We have received your inquiry and will reply to <strong>{formData.email}</strong> shortly.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', subject: '', message: '' });
                    }}
                    className="rounded-xl border border-slate-300 px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-base font-bold text-slate-900 mb-2">Send an Inquiry</h2>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden ${
                      errors.name ? 'border-rose-400 focus:border-rose-600' : 'border-slate-300 focus:border-teal-600'
                    }`}
                  />
                  {errors.name && <div className="text-[10px] text-rose-600 mt-1">{errors.name}</div>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden ${
                      errors.email ? 'border-rose-400 focus:border-rose-600' : 'border-slate-300 focus:border-teal-600'
                    }`}
                  />
                  {errors.email && <div className="text-[10px] text-rose-600 mt-1">{errors.email}</div>}
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Question about EMI calculations"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden ${
                      errors.subject ? 'border-rose-400 focus:border-rose-600' : 'border-slate-300 focus:border-teal-600'
                    }`}
                  />
                  {errors.subject && <div className="text-[10px] text-rose-600 mt-1">{errors.subject}</div>}
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tell us how we can help..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden ${
                      errors.message ? 'border-rose-400 focus:border-rose-600' : 'border-slate-300 focus:border-teal-600'
                    }`}
                  />
                  {errors.message && <div className="text-[10px] text-rose-600 mt-1">{errors.message}</div>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-700 py-3 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Message'}</span>
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
