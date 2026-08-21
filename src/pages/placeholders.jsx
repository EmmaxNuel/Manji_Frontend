import MainLayout from '../layouts/MainLayout'

function PlaceholderPage({ title, description }) {
  return (
    <MainLayout>
      <div className="page-container py-20 text-center">
        <h1 className="text-3xl font-bold mb-3">{title}</h1>
        <p className="text-[var(--color-muted)]">{description}</p>
        <p className="mt-6 text-xs text-[var(--color-muted)] bg-[var(--color-card)] inline-block px-3 py-1 rounded-full">
          Coming soon
        </p>
      </div>
    </MainLayout>
  )
}

export function NotFoundPage() {
  return (
    <PlaceholderPage
      title="404 – Page Not Found"
      description="The page you're looking for doesn't exist."
    />
  )
}
