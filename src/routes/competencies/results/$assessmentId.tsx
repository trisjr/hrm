import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/competencies/results/$assessmentId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/competencies/results/$assessmentId"!</div>
}
