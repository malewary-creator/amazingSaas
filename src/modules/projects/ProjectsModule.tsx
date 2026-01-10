/**
 * Projects Module
 * Routing and management for solar installation projects
 */

import { Routes, Route } from 'react-router-dom';
import ProjectsList from './ProjectsList';
import ProjectForm from './ProjectForm';
import ProjectDetails from './ProjectDetails';
import ProjectsKanban from './ProjectsKanban';
import { ProjectMaterials } from './ProjectMaterials';

function ProjectsModule() {
  return (
    <Routes>
      <Route index element={<ProjectsList />} />
      <Route path="kanban" element={<ProjectsKanban />} />
      <Route path="new" element={<ProjectForm />} />
      <Route path=":id" element={<ProjectDetails />} />
      <Route path=":id/materials" element={<ProjectMaterials />} />
      <Route path=":id/edit" element={<ProjectForm />} />
    </Routes>
  );
}

export default ProjectsModule;
