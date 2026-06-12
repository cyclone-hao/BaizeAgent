import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/app/components/base/button'
import Toast from '@/app/components/base/toast'
import Input from '@/app/components/base/input'
import { login } from '@/service/common'
import { noop } from 'lodash-es'
import { resolvePostLoginRedirect } from '../utils/post-login-redirect'
import type { ResponseError } from '@/service/fetch'

type PhoneLoginProps = {
  isInvite: boolean
}

export default function PhoneLogin({ isInvite }: PhoneLoginProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const phoneRegex = /^1[3-9]\d{9}$/

  const handlePhoneLogin = async () => {
    if (!phone) {
      Toast.notify({ type: 'error', message: '请输入手机号' })
      return
    }
    if (!phoneRegex.test(phone)) {
      Toast.notify({ type: 'error', message: '手机号格式不正确' })
      return
    }
    if (!password?.trim()) {
      Toast.notify({ type: 'error', message: '请输入密码' })
      return
    }

    try {
      setIsLoading(true)
      const loginData: Record<string, any> = {
        phone,
        password,
        remember_me: true,
      }
      const res = await login({
        url: '/phone-login',
        body: loginData,
      })
      if (res.result === 'success') {
        localStorage.setItem('console_token', res.data.access_token)
        localStorage.setItem('refresh_token', res.data.refresh_token)
        const redirectUrl = resolvePostLoginRedirect(searchParams)
        router.replace(redirectUrl || '/home')
      }
      else {
        Toast.notify({
          type: 'error',
          message: res.data,
        })
      }
    }
    catch (error) {
      if ((error as ResponseError).code === 'authentication_failed') {
        Toast.notify({
          type: 'error',
          message: '手机号或密码错误',
        })
      }
    }
    finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={noop}>
      <div className='mb-5'>
        <label htmlFor="phone" className="text-[14px] font-medium text-[#344054]">
          手机号
        </label>
        <div className="mt-1.5">
          <Input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="请输入手机号"
            tabIndex={1}
          />
        </div>
      </div>

      <div className='mb-5'>
        <label htmlFor="phone-password">
          <span className='text-[14px] font-medium text-[#344054]'>密码</span>
        </label>
        <div className="relative mt-1.5">
          <Input
            id="phone-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter')
                handlePhoneLogin()
            }}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="请输入密码"
            tabIndex={2}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-1">
            <Button
              type="button"
              variant='ghost'
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '👀' : '😝'}
            </Button>
          </div>
        </div>
      </div>

      <div className='mb-1'>
        <Button
          tabIndex={3}
          variant='primary'
          onClick={handlePhoneLogin}
          disabled={isLoading || !phone || !password}
          className="!h-[44px] w-full !text-[15px] !font-semibold"
        >登录</Button>
      </div>
    </form>
  )
}
