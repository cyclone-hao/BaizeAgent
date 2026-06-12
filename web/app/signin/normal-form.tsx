import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { RiContractLine, RiDoorLockLine, RiErrorWarningFill } from '@remixicon/react'
import Loading from '../components/base/loading'
import MailAndCodeAuth from './components/mail-and-code-auth'
import MailAndPasswordAuth from './components/mail-and-password-auth'
import PhoneLogin from './components/phone-login'
import SocialAuth from './components/social-auth'
import SSOAuth from './components/sso-auth'
import cn from '@/utils/classnames'
import { invitationCheck } from '@/service/common'
import { LicenseStatus } from '@/types/feature'
import Toast from '@/app/components/base/toast'
import { useGlobalPublicStore } from '@/context/global-public-context'
import { resolvePostLoginRedirect } from './utils/post-login-redirect'

const NormalForm = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const consoleToken = decodeURIComponent(searchParams.get('access_token') || '')
  const refreshToken = decodeURIComponent(searchParams.get('refresh_token') || '')
  const message = decodeURIComponent(searchParams.get('message') || '')
  const invite_token = decodeURIComponent(searchParams.get('invite_token') || '')
  const [isLoading, setIsLoading] = useState(true)
  const { systemFeatures } = useGlobalPublicStore()
  const [authType, updateAuthType] = useState<'code' | 'password'>('password')
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email')
  const [showORLine, setShowORLine] = useState(false)
  const [allMethodsAreDisabled, setAllMethodsAreDisabled] = useState(false)
  const [workspaceName, setWorkSpaceName] = useState('')

  const isInviteLink = Boolean(invite_token && invite_token !== 'null')

  const init = useCallback(async () => {
    try {
      if (consoleToken && refreshToken) {
        localStorage.setItem('console_token', consoleToken)
        localStorage.setItem('refresh_token', refreshToken)
        const redirectUrl = resolvePostLoginRedirect(searchParams)
        router.replace(redirectUrl || '/home')
        return
      }

      if (message) {
        Toast.notify({
          type: 'error',
          message,
        })
      }
      setAllMethodsAreDisabled(!systemFeatures.enable_social_oauth_login && !systemFeatures.enable_email_code_login && !systemFeatures.enable_email_password_login && !systemFeatures.sso_enforced_for_signin)
      setShowORLine((systemFeatures.enable_social_oauth_login || systemFeatures.sso_enforced_for_signin) && (systemFeatures.enable_email_code_login || systemFeatures.enable_email_password_login))
      updateAuthType(systemFeatures.enable_email_password_login ? 'password' : 'code')
      if (isInviteLink) {
        const checkRes = await invitationCheck({
          url: '/activate/check',
          params: {
            token: invite_token,
          },
        })
        setWorkSpaceName(checkRes?.data?.workspace_name || '')
      }
    }
    catch (error) {
      console.error(error)
      setAllMethodsAreDisabled(true)
    }
    finally { setIsLoading(false) }
  }, [consoleToken, refreshToken, message, router, invite_token, isInviteLink, systemFeatures])
  useEffect(() => {
    init()
  }, [init])
  if (isLoading || consoleToken) {
    return <div className={
      cn(
        'flex w-full grow flex-col items-center justify-center',
        'px-6',
        'md:px-[108px]',
      )
    }>
      <Loading type='area' />
    </div>
  }
  if (systemFeatures.license?.status === LicenseStatus.LOST) {
    return <div className='mx-auto mt-8 w-full'>
      <div className='relative'>
        <div className="rounded-lg bg-gradient-to-r from-workflow-workflow-progress-bg-1 to-workflow-workflow-progress-bg-2 p-4">
          <div className='shadows-shadow-lg relative mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-components-card-bg shadow'>
            <RiContractLine className='h-5 w-5' />
            <RiErrorWarningFill className='absolute -right-1 -top-1 h-4 w-4 text-text-warning-secondary' />
          </div>
          <p className='system-sm-medium text-text-primary'>{t('login.licenseLost')}</p>
          <p className='system-xs-regular mt-1 text-text-tertiary'>{t('login.licenseLostTip')}</p>
        </div>
      </div>
    </div>
  }
  if (systemFeatures.license?.status === LicenseStatus.EXPIRED) {
    return <div className='mx-auto mt-8 w-full'>
      <div className='relative'>
        <div className="rounded-lg bg-gradient-to-r from-workflow-workflow-progress-bg-1 to-workflow-workflow-progress-bg-2 p-4">
          <div className='shadows-shadow-lg relative mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-components-card-bg shadow'>
            <RiContractLine className='h-5 w-5' />
            <RiErrorWarningFill className='absolute -right-1 -top-1 h-4 w-4 text-text-warning-secondary' />
          </div>
          <p className='system-sm-medium text-text-primary'>{t('login.licenseExpired')}</p>
          <p className='system-xs-regular mt-1 text-text-tertiary'>{t('login.licenseExpiredTip')}</p>
        </div>
      </div>
    </div>
  }
  if (systemFeatures.license?.status === LicenseStatus.INACTIVE) {
    return <div className='mx-auto mt-8 w-full'>
      <div className='relative'>
        <div className="rounded-lg bg-gradient-to-r from-workflow-workflow-progress-bg-1 to-workflow-workflow-progress-bg-2 p-4">
          <div className='shadows-shadow-lg relative mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-components-card-bg shadow'>
            <RiContractLine className='h-5 w-5' />
            <RiErrorWarningFill className='absolute -right-1 -top-1 h-4 w-4 text-text-warning-secondary' />
          </div>
          <p className='system-sm-medium text-text-primary'>{t('login.licenseInactive')}</p>
          <p className='system-xs-regular mt-1 text-text-tertiary'>{t('login.licenseInactiveTip')}</p>
        </div>
      </div>
    </div>
  }

  return (
    <>
      <div className="mx-auto w-full">
        {isInviteLink && (
          <div className="mb-6">
            <p className="text-[15px] font-medium text-[#101828]">{t('login.join')}{workspaceName}</p>
            {!systemFeatures.branding.enabled && <p className="mt-1 text-[13px] text-[#667085]">{t('login.joinTipStart')}{workspaceName}{t('login.joinTipEnd')}</p>}
          </div>
        )}
        <div className="relative">
          <div className="flex flex-col gap-3">
            {systemFeatures.enable_social_oauth_login && <SocialAuth />}
            {systemFeatures.sso_enforced_for_signin && <div className='w-full'>
              <SSOAuth protocol={systemFeatures.sso_enforced_for_signin_protocol} />
            </div>}
          </div>

          {showORLine && <div className="relative mt-6">
            <div className="flex items-center">
              <div className="h-px flex-1 bg-gradient-to-r from-background-gradient-mask-transparent to-divider-regular"></div>
              <span className="system-xs-medium-uppercase px-3 text-text-tertiary">{t('login.or')}</span>
              <div className="h-px flex-1 bg-gradient-to-l from-background-gradient-mask-transparent to-divider-regular"></div>
            </div>
          </div>}

          {/* 邮箱/手机号 Tab 切换 */}
          <div className="mb-4 mt-4 flex gap-1 rounded-lg bg-[#f4f3fb] p-1">
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              className={`flex-1 rounded-md py-2 text-[13px] font-medium transition-all ${
                loginMethod === 'email'
                  ? 'bg-white text-[#6938ef] shadow-sm'
                  : 'text-[#667085] hover:text-[#344054]'
              }`}
            >邮箱登录</button>
            <button
              type="button"
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 rounded-md py-2 text-[13px] font-medium transition-all ${
                loginMethod === 'phone'
                  ? 'bg-white text-[#6938ef] shadow-sm'
                  : 'text-[#667085] hover:text-[#344054]'
              }`}
            >手机号登录</button>
          </div>

          {loginMethod === 'email' && (
            (systemFeatures.enable_email_code_login || systemFeatures.enable_email_password_login) ? <>
              {systemFeatures.enable_email_code_login && authType === 'code' && <>
                <MailAndCodeAuth isInvite={isInviteLink} />
                {systemFeatures.enable_email_password_login && <div className='cursor-pointer py-1 text-center' onClick={() => { updateAuthType('password') }}>
                  <span className='text-[13px] font-medium text-[#6938ef] hover:text-[#5b2ed6]'>{t('login.usePassword')}</span>
                </div>}
              </>}
              {systemFeatures.enable_email_password_login && authType === 'password' && <>
                <MailAndPasswordAuth isInvite={isInviteLink} isEmailSetup={systemFeatures.is_email_setup} allowRegistration={systemFeatures.is_allow_register} />
                {systemFeatures.enable_email_code_login && <div className='cursor-pointer py-1 text-center' onClick={() => { updateAuthType('code') }}>
                  <span className='text-[13px] font-medium text-[#6938ef] hover:text-[#5b2ed6]'>{t('login.useVerificationCode')}</span>
                </div>}
              </>}
            </> : null
          )}

          {loginMethod === 'phone' && (
            <PhoneLogin isInvite={isInviteLink} />
          )}

          {allMethodsAreDisabled && <>
            <div className="rounded-lg bg-gradient-to-r from-workflow-workflow-progress-bg-1 to-workflow-workflow-progress-bg-2 p-4">
              <div className='shadows-shadow-lg mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-components-card-bg shadow'>
                <RiDoorLockLine className='h-5 w-5' />
              </div>
              <p className='system-sm-medium text-text-primary'>{t('login.noLoginMethod')}</p>
              <p className='system-xs-regular mt-1 text-text-tertiary'>{t('login.noLoginMethodTip')}</p>
            </div>
          </>}

          {/* Footer links */}
          <div className="mt-5 flex items-center justify-center gap-4 text-[13px]">
            <span className="text-[#667085]">
              没有账户？
              <Link className="ml-1 font-medium text-[#6938ef] hover:text-[#5b2ed6]" href='/signup'>
                立即注册
              </Link>
            </span>
            {systemFeatures.is_email_setup && (
              <Link className="font-medium text-[#6938ef] hover:text-[#5b2ed6]" href={`/reset-password?${searchParams.toString()}`}>
                忘记密码
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default NormalForm
