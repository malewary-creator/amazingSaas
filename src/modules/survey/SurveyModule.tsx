/**
 * Survey Module
 * Routing and management for site surveys
 */

import { Routes, Route } from 'react-router-dom';
import SurveysList from './SurveysList';
import SurveyForm from './SurveyForm';
import SurveyDetails from './SurveyDetails';

function SurveyModule() {
  return (
    <Routes>
      <Route index element={<SurveysList />} />
      <Route path="new" element={<SurveyForm />} />
      <Route path=":id" element={<SurveyDetails />} />
      <Route path=":id/edit" element={<SurveyForm />} />
    </Routes>
  );
}

export default SurveyModule;
