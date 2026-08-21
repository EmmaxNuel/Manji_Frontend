/**
 * tourSteps.js – declarative tour definitions.
 *
 * Each tour is a list of steps targeting a CSS selector on the current page.
 * Steps are data, not one-off popups, so new contextual tours can be added by
 * appending an entry here and dropping a matching `data-tour` attribute (or
 * selector) into the target page.
 */

export const TOURS = {
  welcome: {
    key: 'welcome',
    title: 'Welcome to MANJI',
    steps: [
      { target: 'nav a[href="/"]', title: 'Home', body: 'Discover featured stories and what is trending on Manji.', expression: 'welcome' },
      { target: 'nav a[href="/discover"]', title: 'Discover', body: 'Search and explore stories by genre and format.', expression: 'helpful' },
      { target: 'nav a[href="/projects"]', title: 'Projects', body: 'Your creative works live here — every project grows from a story into animation.', expression: 'excited' },
      { target: 'nav a[href="/create"]', title: 'Create', body: 'Start a new project or manage your published stories.', expression: 'happy' },
      { target: 'nav a[href="/library"]', title: 'Library', body: 'Track what you are currently reading.', expression: 'helpful' },
    ],
    final: { title: 'You are ready', body: 'That is the tour. From imagination to animation — go make something great.', expression: 'celebrating' },
  },

  create_project: {
    key: 'create_project',
    title: 'Create a Project',
    steps: [
      { target: '[data-tour="project-type"]', title: 'Project type', body: 'Choose what you are making — story, comic, manga, manhua or animation.', expression: 'helpful' },
      { target: '[data-tour="art-style"]', title: 'Art style', body: 'Pick a style. Manji applies it to every AI image and character automatically.', expression: 'excited' },
    ],
    final: { title: 'Ready to create', body: 'Fill in the details and press Create Project.', expression: 'welcome' },
  },

  project_workspace: {
    key: 'project_workspace',
    title: 'MANJI STUDIO',
    steps: [
      { target: '[data-tour="workspace-nav"]', title: 'Studio sections', body: 'Move between Story, Characters, Scenes, Storyboard, Animation, Audio, Assets and Manji AI — your project stays open.', expression: 'helpful' },
      { target: '[data-tour="workspace-overview"]', title: 'Overview', body: 'Your project details and linked story appear here.', expression: 'welcome' },
    ],
    final: { title: 'Studio ready', body: 'Each section opens here as it is built in later phases.', expression: 'happy' },
  },
}

export function getTour(key) {
  return TOURS[key] || null
}