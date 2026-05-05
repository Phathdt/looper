import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { Link } from 'react-router-dom'

import { useLogin } from './hooks/use-login'

export function LoginPage() {
  const { form, submit, isPending, serverError } = useLogin()
  const {
    register,
    formState: { errors, isValid },
  } = form

  return (
    <div className='min-h-screen flex items-center justify-center bg-background px-4'>
      <Card className='w-full max-w-sm'>
        <CardHeader>
          <h1 className='text-2xl font-bold text-center'>Looper</h1>
          <p className='text-sm text-muted-foreground text-center'>Sign in to your account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className='flex flex-col gap-3' noValidate>
            <div>
              <Input
                type='email'
                placeholder='Email'
                autoComplete='email'
                aria-invalid={Boolean(errors.email)}
                {...register('email')}
              />
              {errors.email && <p className='text-xs text-destructive mt-1'>{errors.email.message}</p>}
            </div>
            <div>
              <Input
                type='password'
                placeholder='Password'
                autoComplete='current-password'
                aria-invalid={Boolean(errors.password)}
                {...register('password')}
              />
              {errors.password && <p className='text-xs text-destructive mt-1'>{errors.password.message}</p>}
            </div>
            {serverError && (
              <p className='text-sm text-destructive' role='alert'>
                {serverError}
              </p>
            )}
            <Button type='submit' disabled={isPending || !isValid}>
              {isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <p className='text-sm text-center text-muted-foreground mt-4'>
            No account?{' '}
            <Link to='/register' className='underline underline-offset-2 hover:text-foreground'>
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
