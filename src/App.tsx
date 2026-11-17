import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "../src/components/sidebar";
import Footer from "./components/footer";
import LoginPage from "./screens/login";
import PatientsList from "./screens/allpatient";
import PatientView from "./screens/patientview";
import VideoCallingApp from "./screens/webrtc";
import Subscription from "./screens/Subscription";
import Home from "./screens/Home";
import TherapyAnalytics from "./screens/therapyanalysis";
import ProtectedRoute from "./components/ProtectedRoute";
import PaymentDashboard from "./screens/PaymentDashboard";
import AllDoctors from "./screens/AllDoctors";
import EachDoctors from "./screens/EachDoctors";
import EditDoctor from "./screens/EditDoctor";
import CreateTherapyPlan from "./screens/createTherapyPlan";
import BookAppointment from "./screens/bookAppointment";
import DoctorProfileEdit from "./screens/EditDoctorProfile";
import CreateBlogScreen from "./screens/CreateBlogScreen";
import RegisterPatient from "./screens/registerPatient";
import UpdatePatient from "./screens/updatePatient";
import ProfileScreen from "./screens/ProfileScreen";
import PlanDetails from "./screens/planDetails";
import BlogDetailsScreen from "./screens/BlogDetailsScreen";
import UpdateBlogScreen from "./screens/UpdateBlogScreen";
import SettingsScreen from "./screens/SettingsScreen";
import OrganizationSettingsScreen from "./screens/OrganizationSettingScreen";
import EditTherapyPlan from "./screens/EditTherapyPlan";
import PaymentDetails from "./screens/paymentDetails";
import Notifications from "./screens/notifications";
import NotificationDetail from "./screens/notificationDetails";
import AppointmentsPage from "./screens/Appointments";
import MyPatients from "./screens/MyPatients";
import DoctorRegister from "./screens/DoctorRegister";
import AppointmentDetails from "./screens/AppointmentDetails";
import MyAppointments from "./screens/MyAppointments";
import LeaderBoard from "./screens/LeaderBoard";
import DailyReport from "./screens/DailyReport";
import AppointmentsTimeline from "./screens/AppointmentsTimeline";
import Reports from "./screens/Reports";
import TherapyTypesByDoctor from "./screens/TherapyTypesByDoctor";
import AdminReports from "./screens/AdminReport";
import PaymentStatus from "./screens/paymentStatusDis";
import UserLogs from "./screens/userlogs";
import TermsAndConditions from "./screens/TermsofService";
import PrivacyPolicy from "./screens/PrivacyPolicy";
import InvoiceSeriesCreation from "./screens/InvoiceSeries";
import InvoiceList from "./screens/invoicelist";
import InvoiceDetails from "./screens/inoiceDetails";
import DoctorLocationAssignment from "./components/DoctorLocationAssignment";
import ScrollToTop from "./components/ScrollToTop";
import Collection from "./screens/collection";
import CreatePrescription from "./screens/CreatePrescription";
import DoctorRegistration from "./screens/DoctorRegistration";
import InvoiceMain from "./screens/InvoiceMain";
import PaymentScreen from "./screens/PaymentScreen";
import BookConsultation from "./screens/setupConsultation";
import MarkCompleteAppointment from "./screens/MarkCompleteAppointment";
import CompleteConsultation from "./screens/CompleteConsultation";
import ConsultationDetails from "./screens/ConsultationDetails";
import AppointmentSuccess from "./components/AppointmentSuccess";
import EditConsultation from "./screens/EditConsultation";
import PlanSessions from "./screens/PlanSessions";
import SessionDetails from "./screens/SessionsDetails";
import EditSession from "./screens/editSession";
import AddExpense from "./screens/ExpensesModule/AddExpense";
import ExpenseList from "./screens/ExpensesModule/ExpenseList";
import EditExpense from "./screens/ExpensesModule/EditExpense";
import PatientReport from "./screens/patientReport";
import ExpenseDetail from "./screens/ExpensesModule/ExpenseDetail";
import EditOtherInvoice from "./screens/editOtherInvoice";
import RehabIntakeForm from "./screens/RehabIntakeForm";
import ConsentFormScreen from "./components/Rehab/ConsentFormGenerator";
import CreateDepartmentScreen from "./screens/CreateDepartmentScreen";
import DepartmentListScreen from "./screens/DepartmentList";
import DepartmentDetailsScreen from "./screens/DepartmentDetailsScreen";
import EditDepartmentScreen from "./screens/EditDepartmentScreen";
import FormBuilder from "./screens/Rehab/FormBuilder";
import AssessmentsList from "./screens/Rehab/AssesmentsList";
import TakeAssessment from "./screens/Rehab/TakeAssessment";
import AssessmentDetails from "./screens/Rehab/AssessmentDetails";
import EditAssessment from "./screens/Rehab/EditAssesmentDetails";
import MedicineMaster from "./screens/MedicineMaster";
import CreateSession from "./screens/CreateSession";

// --- NEW IMPORTS ---
import ActivePlansList from "./screens/ActivePlansList";
import CreateGroupSession from "./screens/CreateGroupSession";
import CreateLectureSession from "./screens/Rehab/CreateLectureSession";
import LectureSessionList from "./screens/Rehab/LectureSessionList";
import ViewLectureSession from "./screens/Rehab/ViewLectureSession";
import EditLectureSession from "./screens/Rehab/EditLectureSession";
import AftercareReport from "../src/components/Rehab/AftercareReport"; // Added import
import PerformanceReport from "./screens/Rehab/PerformanceReport";
import CompletedPlansList from "./screens/CompletedPlansList";
import ClosePlanScreen from "./components/closePlan";
import AfterCareSession from "./screens/AfterCareSession";
import ArchivedPatientsList from "./screens/ArchivedPatientsList";
import PhysicianAftercarePhase from "./screens/PhysicianAftercarePhase";
import CounselorAftercarePhase from "./screens/CounselorAftercarePhase";
import PatientAnalyticsDashboard from "./screens/dashboard";
import PrescriptionTemplateMaster from "./screens/PrescriptionTemplateMaster";
import MyPerformance from "./screens/MyPerformance";

const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen" style={{ backgroundColor: "#f5f5f5" }}>
        <div className="flex" style={{ flex: 1 }}>
          <Sidebar />
          <div className="main-content">
            <Routes>
              {/* Public Routes - accessible without login */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/termsofservice" element={<TermsAndConditions />} />
              <Route path="/privacypolicy" element={<PrivacyPolicy />} />
              <Route
                path="/doctor/registration"
                element={<DoctorRegistration />}
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <PatientAnalyticsDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctorperformance"
                element={
                  <ProtectedRoute>
                    <TherapyAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment/:patientId"
                element={
                  <ProtectedRoute>
                    <PaymentScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/createsession/:patientId"
                element={
                  <ProtectedRoute>
                    <CreateSession />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/createprescription/:patientId"
                element={
                  <ProtectedRoute>
                    <CreatePrescription />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/UserLogs"
                element={
                  <ProtectedRoute>
                    <UserLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/PaymentDashboard"
                element={
                  <ProtectedRoute>
                    <PaymentDashboard />
                  </ProtectedRoute>
                }
              />{" "}
              <Route
                path="/invoice"
                element={
                  <ProtectedRoute>
                    <InvoiceMain />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create/series"
                element={
                  <ProtectedRoute>
                    <InvoiceSeriesCreation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoice/list"
                element={
                  <ProtectedRoute>
                    <InvoiceList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoice/:invoiceId"
                element={
                  <ProtectedRoute>
                    <InvoiceDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/consent-form/:patientId"
                element={<ConsentFormScreen />}
              />
              <Route
                path="/formBuilder"
                element={
                  <ProtectedRoute>
                    <FormBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/take-assessment/:patientId"
                element={
                  <ProtectedRoute>
                    <TakeAssessment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assessment/:assessmentId"
                element={
                  <ProtectedRoute>
                    <AssessmentDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/editAssessment/:assessmentId"
                element={
                  <ProtectedRoute>
                    <EditAssessment />
                  </ProtectedRoute>
                }
              />
              <Route path="/AssessmentsList" element={<AssessmentsList />} />
              <Route path="/formBuilder/new" element={<FormBuilder />} />
              <Route
                path="/formBuilder/edit/:templateId"
                element={<FormBuilder />}
              />
              <Route
                path="/edit/invoice/:invoiceId"
                element={
                  <ProtectedRoute>
                    <EditOtherInvoice />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/PatientsList"
                element={
                  <ProtectedRoute>
                    <PatientsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ArchivedPatientsList"
                element={
                  <ProtectedRoute>
                    <ArchivedPatientsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/Patient/:patientId"
                element={
                  <ProtectedRoute>
                    <PatientView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/AllDoctors"
                element={
                  <ProtectedRoute>
                    <AllDoctors />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/Doctor/:doctorId/edit"
                element={
                  <ProtectedRoute>
                    <EditDoctor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/Doctor/edit"
                element={
                  <ProtectedRoute>
                    <DoctorProfileEdit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfileScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/blog/:blogId"
                element={
                  <ProtectedRoute>
                    <BlogDetailsScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/Updateblog/:blogId"
                element={
                  <ProtectedRoute>
                    <UpdateBlogScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/SettingsScreen"
                element={
                  <ProtectedRoute>
                    <SettingsScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/OrganizationSettings"
                element={
                  <ProtectedRoute>
                    <OrganizationSettingsScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/createBlogDetailsScreen"
                element={
                  <ProtectedRoute>
                    <CreateBlogScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/Doctor/:doctorId"
                element={
                  <ProtectedRoute>
                    <EachDoctors />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/videoCall/:ngoId"
                element={
                  <ProtectedRoute>
                    <VideoCallingApp />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment"
                element={
                  <ProtectedRoute>
                    <Subscription />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/collection"
                element={
                  <ProtectedRoute>
                    <Collection />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/createTherapy/:patientId"
                element={
                  <ProtectedRoute>
                    <CreateTherapyPlan />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/performanceReport"
                element={
                  <ProtectedRoute>
                    <PerformanceReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookAppoinment/:patientId"
                element={
                  <ProtectedRoute>
                    <BookAppointment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/complete-consultation/:patientId/:appointmentId?"
                element={
                  <ProtectedRoute>
                    <CompleteConsultation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit-consultation/:consultationId"
                element={
                  <ProtectedRoute>
                    <EditConsultation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/consultationDetails/:consultationId"
                element={
                  <ProtectedRoute>
                    <ConsultationDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mark-appointment/:appointmentId"
                element={
                  <ProtectedRoute>
                    <MarkCompleteAppointment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/complete-aftercare-physician/:appointmentId"
                element={
                  <ProtectedRoute>
                    <PhysicianAftercarePhase />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/complete-aftercare-counselor/:appointmentId"
                element={
                  <ProtectedRoute>
                    <CounselorAftercarePhase />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/department/create"
                element={
                  <ProtectedRoute>
                    <CreateDepartmentScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/departments"
                element={
                  <ProtectedRoute>
                    <DepartmentListScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/department/:id"
                element={
                  <ProtectedRoute>
                    <DepartmentDetailsScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit/department/:id"
                element={
                  <ProtectedRoute>
                    <EditDepartmentScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/registerPatient"
                element={
                  <ProtectedRoute>
                    <RegisterPatient />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/updatePatient/:patientId"
                element={
                  <ProtectedRoute>
                    <UpdatePatient />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patientReport"
                element={
                  <ProtectedRoute>
                    <PatientReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/addExpense"
                element={
                  <ProtectedRoute>
                    <AddExpense />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expenseList"
                element={
                  <ProtectedRoute>
                    <ExpenseList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expenseDetails/:expenseId"
                element={
                  <ProtectedRoute>
                    <ExpenseDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/editExpense/:expenseId"
                element={
                  <ProtectedRoute>
                    <EditExpense />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/planDetails/:planId"
                element={
                  <ProtectedRoute>
                    <PlanDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/appointment-success"
                element={
                  <ProtectedRoute>
                    <AppointmentSuccess />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-group-session"
                element={
                  <ProtectedRoute>
                    <CreateGroupSession />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-lecture-session"
                element={
                  <ProtectedRoute>
                    <CreateLectureSession />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lectureSessionList"
                element={
                  <ProtectedRoute>
                    <LectureSessionList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/view-lecture/:id"
                element={
                  <ProtectedRoute>
                    <ViewLectureSession />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit-lecture/:id"
                element={
                  <ProtectedRoute>
                    <EditLectureSession />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assignDoctorLocation"
                element={
                  <ProtectedRoute>
                    <DoctorLocationAssignment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/editTherapyPlan/:planId"
                element={
                  <ProtectedRoute>
                    <EditTherapyPlan />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment/:planId"
                element={
                  <ProtectedRoute>
                    <PaymentDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/MyPatients"
                element={
                  <ProtectedRoute>
                    <MyPatients />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/planSessions/:planId"
                element={
                  <ProtectedRoute>
                    <PlanSessions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sessionDetails/:sessionId"
                element={
                  <ProtectedRoute>
                    <SessionDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/editSession/:sessionId"
                element={
                  <ProtectedRoute>
                    <EditSession />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/DoctorRegister"
                element={
                  <ProtectedRoute>
                    <DoctorRegister />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notification/:notificationId"
                element={
                  <ProtectedRoute>
                    <NotificationDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/myAppointments"
                element={
                  <ProtectedRoute>
                    <MyAppointments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderReport"
                element={
                  <ProtectedRoute>
                    <LeaderBoard selectedMonth={"0"} selectedYear={"0"} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/DailyReport"
                element={
                  <ProtectedRoute>
                    <DailyReport selectedMonth={"0"} selectedYear={"0"} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/AppointmentsTimeline"
                element={
                  <ProtectedRoute>
                    <AppointmentsTimeline
                      selectedMonth={"0"}
                      selectedYear={"0"}
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/Reports"
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/TherapyTypeByDoctor"
                element={
                  <ProtectedRoute>
                    <TherapyTypesByDoctor
                      selectedMonth={"0"}
                      selectedYear={"0"}
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/AdminReport"
                element={
                  <ProtectedRoute>
                    <AdminReports selectedMonth={"0"} selectedYear={"0"} />
                  </ProtectedRoute>
                }
              />
              {/* --- ADDED AFTERCARE REPORT ROUTE --- */}
              <Route
                path="/aftercarereport"
                element={
                  <ProtectedRoute>
                    <AftercareReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/get/appointments"
                element={
                  <ProtectedRoute>
                    <AppointmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/get/aftercare"
                element={
                  <ProtectedRoute>
                    <AfterCareSession />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/MyPerformance"
                element={
                  <ProtectedRoute>
                    <MyPerformance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/appointment-details/:id"
                element={
                  <ProtectedRoute>
                    <AppointmentDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/RehabIntakeForm/:patientId"
                element={
                  <ProtectedRoute>
                    <RehabIntakeForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/consultations/:patientId"
                element={
                  <ProtectedRoute>
                    <BookConsultation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/paymentStatus"
                element={
                  <ProtectedRoute>
                    <PaymentStatus />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/medicines"
                element={
                  <ProtectedRoute>
                    <MedicineMaster />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/prescriptiontemplates"
                element={
                  <ProtectedRoute>
                    <PrescriptionTemplateMaster />
                  </ProtectedRoute>
                }
              />
              {/* --- NEW ACTIVE PLANS ROUTE --- */}
              <Route
                path="/ActivePlans"
                element={
                  <ProtectedRoute>
                    <ActivePlansList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/CompletedPlans"
                element={
                  <ProtectedRoute>
                    <CompletedPlansList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ClosePlan/:planId"
                element={
                  <ProtectedRoute>
                    <ClosePlanScreen />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </div>
        <footer className="footer-container">
          <Footer />
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
