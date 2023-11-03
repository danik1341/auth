import "./global.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SignUp from "./components/SignUp";
import SignIn from "./components/SignIn";
import Navbar from "./components/Navbar";
import Home from "./pages/home/page";
import AddOrgForm from "./pages/addOrgForm/page";
import OrganizationPage from "./pages/organizationPage/page";

function App() {
  return (
    <Router>
      <div className="flex min-h-screen flex-col m-auto min-w-[300px] max-w-7xl p-4">
        <Navbar />
        <Routes>
          <Route path="" element={<Home />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="signin" element={<SignIn />} />
          <Route path="add-org-form" element={<AddOrgForm />} />
          <Route
            path="organization-page/:orgId"
            element={<OrganizationPage />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
