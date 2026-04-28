import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom"

import HomePage from './Pages/HomePage'
import Login from './Pages/Login'
import StudentDashboard from './Pages/StudentDashboard'
import StudentProfile from './Pages/StudentProfile'
import FacultyDashboard from './Pages/FacultyDashboard'
import FacultyProfile from "./Pages/FacultyProfile";
import Signup from "./Pages/Signup"



function App() {
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/login" element={<Login/>} />
        <Route path="/signup" element={<Signup/>} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student-profile" element={<StudentProfile />} />
        <Route path="/faculty" element={<FacultyDashboard />} />
        <Route path="/faculty-profile" element={<FacultyProfile />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
