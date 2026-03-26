import ResetPasswordForm from './ResetPasswordForm'

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return <ResetPasswordForm error={searchParams.error} />
}
