import SignInForm from './SignInForm'

export default function SignInPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string }
}) {
  return <SignInForm error={searchParams.error} message={searchParams.message} />
}
