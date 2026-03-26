import RecaptchaProvider from '@/components/ui/RecaptchaProvider'
import SignUpForm from './SignUpForm'

export default function SignUpPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string }
}) {
  return (
    <RecaptchaProvider>
      <SignUpForm error={searchParams.error} message={searchParams.message} />
    </RecaptchaProvider>
  )
}
