import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <div className="space-y-4">
        <h1 className="text-9xl font-bold tracking-tighter text-primary">
          404
        </h1>
        <h2 className="text-2xl font-bold tracking-tight">Page not found</h2>
        <p className="text-muted-foreground">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <Button asChild className="mt-8" variant="default">
          <Link to="/">Go back home</Link>
        </Button>
      </div>
    </div>
  )
}
