import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, TrendingUp, AtSign } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import GoogleIcon from "@/components/GoogleIcon";

export default function Register() {
  React.useEffect(() => { document.title = "CRMHUG"; }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [showNickname, setShowNickname] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Falha no cadastro.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
        setShowOtp(false);
        setShowNickname(true);
      }
    } catch (err) {
      setError(err.message || "Código de verificação inválido.");
    } finally {
      setLoading(false);
    }
  };

  const handleNicknameSave = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError("Escolha um apelido para continuar.");
      return;
    }
    setLoading(true);
    try {
      await base44.entities.User.create({
        status_acesso: 'Bloqueado',
        role: 'Comercial',
        provider: 'email',
        nickname: nickname.trim(),
      });
      setRegistered(true);
    } catch (err) {
      setError(err.message || "Erro ao salvar perfil.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
    } catch (err) {
      setError(err.message || "Falha ao reenviar o código.");
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  const cardWrapper = (children) => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-xl tracking-wide">CRM</span>
            <span className="text-blue-300 font-medium text-xl"> HUG</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  );

  if (registered) {
    return cardWrapper(
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Cadastro recebido!</h2>
        <p className="text-slate-600 text-sm mb-6">
          Seu cadastro foi recebido com o apelido <strong>@{nickname}</strong>. Sua conta está <strong>bloqueada</strong> até que o administrador libere o seu acesso.
        </p>
        <Link to="/login">
          <Button variant="outline" className="w-full">Voltar ao Login</Button>
        </Link>
      </div>
    );
  }

  if (showNickname) {
    return cardWrapper(
      <>
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
            <AtSign className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Escolha seu apelido</h1>
          <p className="text-slate-500 text-sm mt-1">Este nome será exibido nas oportunidades e tarefas</p>
        </div>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">{error}</div>
        )}
        <form onSubmit={handleNicknameSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nickname">Apelido (nickname)</Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="nickname"
                type="text"
                autoFocus
                placeholder="ex: joao.silva"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading || !nickname.trim()}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Concluir Cadastro"}
          </Button>
        </form>
      </>
    );
  }

  if (showOtp) {
    return cardWrapper(
      <>
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Verifique seu e-mail</h1>
          <p className="text-slate-500 text-sm mt-1">Enviamos um código para <strong>{email}</strong></p>
        </div>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">{error}</div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button className="w-full h-12 font-medium" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verificando...</> : "Verificar"}
        </Button>
        <p className="text-center text-sm text-slate-500 mt-4">
          Não recebeu o código?{" "}
          <button onClick={handleResend} className="text-blue-600 font-medium hover:underline">Reenviar</button>
        </p>
      </>
    );
  }

  return cardWrapper(
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Crie sua conta</h1>
        <p className="text-slate-500 text-sm mt-1">Após o cadastro, aguarde a liberação do administrador</p>
      </div>

      <Button variant="outline" className="w-full h-12 text-sm font-medium mb-6 border-slate-200" onClick={handleGoogle}>
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continuar com Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-slate-400">ou</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input id="email" type="email" autoComplete="email" autoFocus placeholder="seu@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirmar Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando conta...</> : <><UserPlus className="w-4 h-4 mr-2" />Criar conta</>}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Já tem uma conta?{" "}
        <Link to="/login" className="text-blue-600 font-medium hover:underline">Entrar</Link>
      </p>
    </>
  );
}