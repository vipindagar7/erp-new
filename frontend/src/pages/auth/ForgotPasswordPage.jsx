import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPassword, clearError } from "../../redux/auth/authSlice.js";
import { forgotPasswordSchema } from "../../validators/auth.validators.js";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "../../lib/utils.js";

function Background() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute inset-0 bg-[hsl(267,28%,6%)]" />
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-700/15 blur-[100px]" />
      <div className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "radial-gradient(circle, hsl(267,60%,80%) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
    </div>
  );
}

export default function ForgotPasswordPage() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const {
    register, handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  useEffect(() => { dispatch(clearError()); }, []);

  const onSubmit = async (data) => {
    const result = await dispatch(forgotPassword(data));
    if (forgotPassword.fulfilled.match(result)) {
      setSentTo(data.email);
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4">
      <Background />

      <div className="relative w-full max-w-[400px] z-10 animate-[cardIn_0.4s_cubic-bezier(0.16,1,0.3,1)_both]">
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-violet-500/25 via-transparent to-transparent blur-sm" />

        <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/40 p-8">

          {/* Back link */}
          <Link to="/login" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs mb-6 transition-colors group">
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to sign in
          </Link>

          {!sent ? (
            <>
              {/* Header */}
              <div className="mb-7">
                <div className="w-11 h-11 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mb-4">
                  <Mail size={20} className="text-violet-400" />
                </div>
                <h1 className="text-xl font-bold text-white">Forgot password?</h1>
                <p className="text-white/45 text-sm mt-1.5">
                  Enter your registered email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-white/70 text-xs font-medium">Email address</Label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                    <Input
                      type="email"
                      placeholder="you@college.edu"
                      autoComplete="email"
                      {...register("email")}
                      className={cn(
                        "pl-9 h-11 rounded-xl bg-white/8 border-white/10 text-white placeholder:text-white/25",
                        "focus:bg-white/10 focus:border-violet-500/60 focus:ring-violet-500/30 transition-all",
                        errors.email && "border-red-500/60"
                      )}
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-xs mt-1">⚠ {errors.email.message}</p>}
                  {error && <p className="text-red-400 text-xs mt-1">⚠ {error}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-purple-900/30 transition-all active:scale-[0.98]"
                >
                  {loading ? <><Loader2 size={14} className="mr-2 animate-spin" /> Sending…</> : "Send reset link"}
                </Button>
              </form>
            </>
          ) : (
            /* Success state */
            <div className="text-center py-4 animate-[fadeUp_0.4s_ease-out_both]">
              <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={26} className="text-green-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Check your inbox</h2>
              <p className="text-white/45 text-sm leading-relaxed">
                We sent a password reset link to{" "}
                <span className="text-violet-400 font-medium">{sentTo}</span>.
                <br />The link expires in 1 hour.
              </p>
              <p className="text-white/30 text-xs mt-5">
                Didn't receive it?{" "}
                <button onClick={() => setSent(false)} className="text-violet-400 hover:text-violet-300 transition-colors underline underline-offset-2">
                  Try again
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes cardIn { from { opacity:0; transform: translateY(20px) scale(0.97); } to { opacity:1; transform:none; } }
        @keyframes fadeUp { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform:none; } }
      `}</style>
    </div>
  );
}
