import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const API = "https://whatsapp-integration-u7tq.onrender.com";

const Dashboard = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const token = localStorage.getItem("access");

  // 🔐 Protect Dashboard
  useEffect(() => {
    if (!token) navigate("/login");
    fetchFiles();
  }, []);

  // 📂 Fetch uploaded files
  const fetchFiles = async () => {
    const res = await axios.get(`${API}/api/files/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setFiles(res.data);
  };

  // ⬆ Upload file
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    await axios.post(`${API}/api/files/upload/`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    setUploading(false);
    fetchFiles();
  };

  // 🔁 Word → PDF
  const convertWordToPDF = async (id) => {
    const res = await axios.post(
      `${API}/api/files/convert/word-to-pdf/${id}/`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    window.open(`${API}${res.data.pdf_url}`, "_blank");
  };

  // 🔁 PDF → Word
  const convertPDFToWord = async (id) => {
    const res = await axios.post(
      `${API}/api/files/convert/pdf-to-word/${id}/`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    window.open(`${API}${res.data.docx_url}`, "_blank");
  };

  // 🚪 Logout
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="dashboard">
      {/* HEADER */}
      <div className="header">
        <h3>📄 File Converter Dashboard</h3>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* UPLOAD */}
      <div className="upload-box">
        <input type="file" onChange={handleUpload} />
        {uploading && <p>Uploading...</p>}
      </div>

      {/* FILE LIST */}
      <div className="file-list">
        {files.map((file) => (
          <div className="file-card" key={file.id}>
            <p>{file.filename}</p>

            {file.filename.endsWith(".docx") && (
              <button onClick={() => convertWordToPDF(file.id)}>
                Word → PDF
              </button>
            )}

            {file.filename.endsWith(".pdf") && (
              <button onClick={() => convertPDFToWord(file.id)}>
                PDF → Word
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
