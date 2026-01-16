import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
  const token = localStorage.getItem("access");
  if (!token) navigate("/login");
}, []);



  const handleLogout = () => {
    localStorage.clear();        // 🔥 clears local + google JWT
    navigate("/login");
  };

  return (
    <>
      {/* HEADER */}
      <div className="header">
        <h4>Dashboard</h4>
        <button className="btn btn-outline-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* BODY */}
      <div className="tool-grid">
        <div className="card p-3 shadow-sm">
          <h6>File Upload</h6>
          <p>Upload & convert files</p>
        </div>

        <div className="card p-3 shadow-sm">
          <h6>PDF Tools</h6>
          <p>Merge / split PDFs</p>
        </div>

        <div className="card p-3 shadow-sm">
          <h6>Profile</h6>
          <p>Google / Local account</p>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
