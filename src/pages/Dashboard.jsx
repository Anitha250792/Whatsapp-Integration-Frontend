import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaWhatsapp, FaEnvelope } from "react-icons/fa";
import "./Dashboard.css";

const API = "https://whatsapp-integration-u7tq.onrender.com";

const Dashboard = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("access");

  // 🔐 Protect Dashboard
  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      fetchFiles();
    }
  }, []);

  // 📂 Fetch uploaded files
  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${API}/api/files/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles(res.data);
    } catch (err) {
      console.error("Fetch files error", err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  // ⬆ Upload file
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      await axios.post(`${API}/api/files/upload/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      fetchFiles();
    } catch (err) {
      alert("Upload failed");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // 🔁 Word → PDF
  const convertWordToPDF = async (id) => {
    try {
      const res = await axios.post(
        `${API}/api/files/convert/word-to-pdf/${id}/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.open(`${API}${res.data.pdf_url}`, "_blank");
    } catch (err) {
      alert("Conversion failed");
    }
  };

  // 🔁 PDF → Word
  const convertPDFToWord = async (id) => {
    try {
      const res = await axios.post(
        `${API}/api/files/convert/pdf-to-word/${id}/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.open(`${API}${res.data.docx_url}`, "_blank");
    } catch (err) {
      alert("Conversion failed");
    }
  };

  // 📤 WhatsApp Share
  const shareWhatsApp = (filename) => {
    const msg = `I converted this file using File Converter App:\n${filename}\n${API}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // 📧 Gmail Share
  const shareGmail = (filename) => {
    const subject = "File Converted Successfully";
    const body = `Hi,\n\nI converted this file using File Converter App:\n${filename}\n\n${API}`;
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`,
      "_blank"
    );
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
      {loading ? (
        <p>Loading files...</p>
      ) : (
        <div className="file-list">
          {files.length === 0 && <p>No files uploaded</p>}

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

              <div className="share-buttons">
                <FaWhatsapp
                  className="icon whatsapp"
                  onClick={() => shareWhatsApp(file.filename)}
                />
                <FaEnvelope
                  className="icon gmail"
                  onClick={() => shareGmail(file.filename)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
