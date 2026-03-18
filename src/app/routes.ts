import { createBrowserRouter } from "react-router";
import { LandingPage } from "./components/LandingPage";
import { AuthPage } from "./components/AuthPage";
import { OnboardingFlow } from "./components/OnboardingFlow";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { StudentDashboard } from "./components/StudentDashboard";
import { ClassroomInterface } from "./components/ClassroomInterface";
import { CommunityPage } from "./components/CommunityPage";

export const router = createBrowserRouter([
  { path: "/", Component: LandingPage },
  { path: "/auth", Component: AuthPage },
  { path: "/onboarding", Component: OnboardingFlow },
  { path: "/teacher", Component: TeacherDashboard },
  { path: "/student", Component: StudentDashboard },
  { path: "/classroom/:id", Component: ClassroomInterface },
  { path: "/community/:id", Component: CommunityPage },
  { path: "/community", Component: CommunityPage },
]);
