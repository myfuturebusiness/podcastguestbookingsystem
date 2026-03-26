import ForgotPasswordForm from './ForgotPasswordForm'

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string }
}) {
  return <ForgotPasswordForm error={searchParams.error} message={searchParams.message} />
}
