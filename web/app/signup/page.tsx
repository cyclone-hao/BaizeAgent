'use client'
import { useState, useContext } from 'react'
import { useRouter } from 'next/navigation'
import Button from '../components/base/button'
import Input from '../components/base/input'
import Toast from '../components/base/toast'
import { emailRegex } from '@/config'
import I18NContext from '@/context/i18n'
import { noop } from 'lodash-es'

type EmailStep = 'email' | 'code' | 'password'
type PhoneStep = 'phone' | 'password'
type RegMethod = 'email' | 'phone'

export default function SignUpPage() {
  const router = useRouter()
  const { locale } = useContext(I18NContext)
  const [method, setMethod] = useState<RegMethod>('email')

  // Email registration state
  const [emailStep, setEmailStep] = useState<EmailStep>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [token, setToken] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailConfirmPassword, setEmailConfirmPassword] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Phone registration state
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('phone')
  const [phone, setPhone] = useState('')
  const [phonePassword, setPhonePassword] = useState('')
  const [phoneConfirmPassword, setPhoneConfirmPassword] = useState('')
  const [phoneLoading, setPhoneLoading] = useState(false)

  const phoneRegex = /^1[3-9]\d{9}$/

  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendCode = async () => {
    if (!email) { Toast.notify({ type: 'error', message: '请输入邮箱' }); return }
    if (!emailRegex.test(email)) { Toast.notify({ type: 'error', message: '邮箱格式不正确' }); return }
    try {
      setEmailLoading(true)
      const res = await fetch('/console/api/email-register/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, language: locale }),
      })
      const data = await res.json()
      if (res.ok && data.result === 'success') {
        setToken(data.data)
        setEmailStep('code')
        startCountdown()
        Toast.notify({ type: 'success', message: '验证码已发送' })
      } else {
        Toast.notify({ type: 'error', message: data.message || '发送失败' })
      }
    } catch {
      Toast.notify({ type: 'error', message: '网络错误' })
    } finally { setEmailLoading(false) }
  }

  const handleVerifyCode = async () => {
    if (!code || code.length < 4) { Toast.notify({ type: 'error', message: '请输入验证码' }); return }
    try {
      setEmailLoading(true)
      const res = await fetch('/console/api/email-register/validity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, token }),
      })
      const data = await res.json()
      if (res.ok && data.is_valid) {
        setToken(data.token)
        setEmailStep('password')
      } else {
        Toast.notify({ type: 'error', message: data.message || '验证码错误' })
      }
    } catch {
      Toast.notify({ type: 'error', message: '网络错误' })
    } finally { setEmailLoading(false) }
  }

  const handleSetEmailPassword = async () => {
    if (!emailPassword || emailPassword.length < 8) { Toast.notify({ type: 'error', message: '密码至少8位' }); return }
    if (emailPassword !== emailConfirmPassword) { Toast.notify({ type: 'error', message: '两次密码不一致' }); return }
    try {
      setEmailLoading(true)
      const res = await fetch('/console/api/email-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: emailPassword, password_confirm: emailConfirmPassword }),
      })
      const data = await res.json()
      if (res.ok && data.result === 'success') {
        localStorage.setItem('console_token', data.data.access_token)
        localStorage.setItem('refresh_token', data.data.refresh_token)
        Toast.notify({ type: 'success', message: '注册成功' })
        router.replace('/home')
      } else {
        Toast.notify({ type: 'error', message: data.message || '注册失败' })
      }
    } catch {
      Toast.notify({ type: 'error', message: '网络错误' })
    } finally { setEmailLoading(false) }
  }

  const handlePhoneNext = () => {
    if (!phone) { Toast.notify({ type: 'error', message: '请输入手机号' }); return }
    if (!phoneRegex.test(phone)) { Toast.notify({ type: 'error', message: '手机号格式不正确' }); return }
    setPhoneStep('password')
  }

  const handleSetPhonePassword = async () => {
    if (!phonePassword || phonePassword.length < 8) { Toast.notify({ type: 'error', message: '密码至少8位' }); return }
    if (phonePassword !== phoneConfirmPassword) { Toast.notify({ type: 'error', message: '两次密码不一致' }); return }
    try {
      setPhoneLoading(true)
      const res = await fetch('/console/api/phone-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: phonePassword, password_confirm: phoneConfirmPassword }),
      })
      const data = await res.json()
      if (res.ok && data.result === 'success') {
        localStorage.setItem('console_token', data.data.access_token)
        localStorage.setItem('refresh_token', data.data.refresh_token)
        Toast.notify({ type: 'success', message: '注册成功' })
        router.replace('/home')
      } else {
        Toast.notify({ type: 'error', message: data.data || data.message || '注册失败' })
      }
    } catch {
      Toast.notify({ type: 'error', message: '网络错误' })
    } finally { setPhoneLoading(false) }
  }

  return (
    <form onSubmit={noop}>
      {/* Method tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-[#f4f3fb] p-1">
        <button
          type="button"
          onClick={() => setMethod('email')}
          className={`flex-1 rounded-md py-2 text-[13px] font-medium transition-all ${
            method === 'email'
              ? 'bg-white text-[#6938ef] shadow-sm'
              : 'text-[#667085] hover:text-[#344054]'
          }`}
        >邮箱注册</button>
        <button
          type="button"
          onClick={() => setMethod('phone')}
          className={`flex-1 rounded-md py-2 text-[13px] font-medium transition-all ${
            method === 'phone'
              ? 'bg-white text-[#6938ef] shadow-sm'
              : 'text-[#667085] hover:text-[#344054]'
          }`}
        >手机号注册</button>
      </div>

      {/* Email registration */}
      {method === 'email' && (<>
        <div className="mb-6 flex items-center gap-2">
          <StepDot active={emailStep === 'email'} done={emailStep !== 'email'} label={'邮箱'} />
          <div className="h-px flex-1 bg-[#eaecf0]" />
          <StepDot active={emailStep === 'code'} done={emailStep === 'password'} label={'验证'} />
          <div className="h-px flex-1 bg-[#eaecf0]" />
          <StepDot active={emailStep === 'password'} done={false} label={'密码'} />
        </div>

        {emailStep === 'email' && (<>
          <h2 className="mb-1 text-[22px] font-semibold text-[#101828]">创建账户</h2>
          <p className="mb-6 text-[14px] text-[#667085]">输入您的邮箱开始注册</p>
          <label className="mb-1.5 block text-[14px] font-medium text-[#344054]">邮箱</label>
          <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="请输入邮箱地址" />
          <div className="mt-6">
            <Button variant="primary" className="!h-[44px] w-full !text-[15px] !font-semibold" disabled={emailLoading || !email} onClick={handleSendCode}>
              {emailLoading ? '发送中...' : '发送验证码'}
            </Button>
          </div>
        </>)}

        {emailStep === 'code' && (<>
          <h2 className="mb-1 text-[22px] font-semibold text-[#101828]">验证邮箱</h2>
          <p className="mb-6 text-[14px] text-[#667085]">验证码已发送至 <span className="font-medium text-[#101828]">{email}</span></p>
          <label className="mb-1.5 block text-[14px] font-medium text-[#344054]">验证码</label>
          <Input value={code} onChange={e => setCode(e.target.value)} placeholder="请输入验证码" onKeyDown={e => e.key === 'Enter' && handleVerifyCode()} />
          <div className="mt-2 text-right">
            {countdown > 0
              ? <span className="text-[13px] text-[#98a2b3]">{countdown}s 后可重新发送</span>
              : <button type="button" className="text-[13px] font-medium text-[#6938ef] hover:text-[#5b2ed6]" onClick={handleSendCode}>重新发送</button>}
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" className="!h-[44px] flex-1 !text-[15px]" onClick={() => setEmailStep('email')}>返回</Button>
            <Button variant="primary" className="!h-[44px] flex-1 !text-[15px] !font-semibold" disabled={emailLoading || !code} onClick={handleVerifyCode}>
              {emailLoading ? '验证中...' : '验证'}
            </Button>
          </div>
        </>)}

        {emailStep === 'password' && (<>
          <h2 className="mb-1 text-[22px] font-semibold text-[#101828]">设置密码</h2>
          <p className="mb-6 text-[14px] text-[#667085]">请设置至少 8 位包含字母和数字的密码</p>
          <label className="mb-1.5 block text-[14px] font-medium text-[#344054]">密码</label>
          <Input value={emailPassword} onChange={e => setEmailPassword(e.target.value)} type="password" placeholder="请输入密码" />
          <label className="mb-1.5 mt-4 block text-[14px] font-medium text-[#344054]">确认密码</label>
          <Input value={emailConfirmPassword} onChange={e => setEmailConfirmPassword(e.target.value)} type="password" placeholder="请再次输入密码" onKeyDown={e => e.key === 'Enter' && handleSetEmailPassword()} />
          <div className="mt-6">
            <Button variant="primary" className="!h-[44px] w-full !text-[15px] !font-semibold" disabled={emailLoading || !emailPassword || !emailConfirmPassword} onClick={handleSetEmailPassword}>
              {emailLoading ? '注册中...' : '完成注册'}
            </Button>
          </div>
        </>)}
      </>)}

      {/* Phone registration */}
      {method === 'phone' && (<>
        <div className="mb-6 flex items-center gap-2">
          <StepDot active={phoneStep === 'phone'} done={phoneStep === 'password'} label={'手机号'} />
          <div className="h-px flex-1 bg-[#eaecf0]" />
          <StepDot active={phoneStep === 'password'} done={false} label={'密码'} />
        </div>

        {phoneStep === 'phone' && (<>
          <h2 className="mb-1 text-[22px] font-semibold text-[#101828]">手机号注册</h2>
          <p className="mb-6 text-[14px] text-[#667085]">输入您的手机号，无需验证码，直接注册</p>
          <label className="mb-1.5 block text-[14px] font-medium text-[#344054]">手机号</label>
          <Input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="请输入手机号" onKeyDown={e => e.key === 'Enter' && handlePhoneNext()} />
          <div className="mt-6">
            <Button variant="primary" className="!h-[44px] w-full !text-[15px] !font-semibold" disabled={!phone} onClick={handlePhoneNext}>
              下一步
            </Button>
          </div>
        </>)}

        {phoneStep === 'password' && (<>
          <h2 className="mb-1 text-[22px] font-semibold text-[#101828]">设置密码</h2>
          <p className="mb-6 text-[14px] text-[#667085]">为手机号 <span className="font-medium text-[#101828]">{phone}</span> 设置密码</p>
          <label className="mb-1.5 block text-[14px] font-medium text-[#344054]">密码</label>
          <Input value={phonePassword} onChange={e => setPhonePassword(e.target.value)} type="password" placeholder="请输入密码（至少8位含字母和数字）" />
          <label className="mb-1.5 mt-4 block text-[14px] font-medium text-[#344054]">确认密码</label>
          <Input value={phoneConfirmPassword} onChange={e => setPhoneConfirmPassword(e.target.value)} type="password" placeholder="请再次输入密码" onKeyDown={e => e.key === 'Enter' && handleSetPhonePassword()} />
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" className="!h-[44px] flex-1 !text-[15px]" onClick={() => setPhoneStep('phone')}>返回</Button>
            <Button variant="primary" className="!h-[44px] flex-1 !text-[15px] !font-semibold" disabled={phoneLoading || !phonePassword || !phoneConfirmPassword} onClick={handleSetPhonePassword}>
              {phoneLoading ? '注册中...' : '完成注册'}
            </Button>
          </div>
        </>)}
      </>)}
    </form>
  )
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${done ? 'bg-[#6938ef] text-white' : active ? 'bg-[#6938ef] text-white' : 'bg-[#eaecf0] text-[#98a2b3]'}`}>
        {done ? '✓' : label[0]}
      </div>
      <span className={`text-[12px] ${active ? 'font-semibold text-[#101828]' : 'text-[#98a2b3]'}`}>{label}</span>
    </div>
  )
}
