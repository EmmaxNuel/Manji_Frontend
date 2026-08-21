/**
 * ProjectsPage – the central Projects hub.
 * Lists the caller's projects and links to Create.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FolderPlus } from 'lucide-react'
import MainLayout from '../../layouts/MainLayout'
import { Spinner, Button } from '../../components/ui'
import ManjiGuide from '../../components/manji/ManjiGuide'
import { projectsService } from './projectsService'
import ProjectCard from './ProjectCard'

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const res = await projectsService.getProjects()
        if (active) setProjects(res.data || [])
      } catch {
        if (active) toast.error('Failed to load projects.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  return (
    <MainLayout>
      <div className="page-container py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-white/50 text-sm mt-1">
              Your creative works — from story to animation.
            </p>
          </div>
          <Link to="/projects/new" className="btn-primary">
            <FolderPlus size={18} className="mr-2" />
            New Project
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-32">
            <Spinner size="lg" />
          </div>
        ) : projects.length === 0 ? (
          <div className="card p-12">
            <ManjiGuide
              expression="excited"
              size="lg"
              animated="bounce"
              title="No projects yet"
              body="Every story starts with one idea. Create a project to begin your journey from imagination to animation."
            >
              <Link to="/projects/new" className="btn-primary inline-flex">
                Create your first project
              </Link>
            </ManjiGuide>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Button variant="ghost" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}