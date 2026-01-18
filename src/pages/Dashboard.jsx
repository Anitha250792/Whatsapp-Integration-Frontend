import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaWhatsapp,
  FaEnvelope,
  FaTrash,
  FaFilePdf,
  FaFileWord,
} from "react-icons/fa";
import "./Dashboard.css";

const API = "https://whatsapp-integration-u7tq.onrender.com";

const Dashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  const [files, setFiles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [signer, setSigner] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchFiles();
  }, [token]);

  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${API}/files/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/login");
      } else {
        alert("Failed to load files");
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (url, filename) => {
    try {
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const blob = new Blob([res.data]);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    } catch {
      alert("❌ Download failed");
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      await axios.post(`${API}/files/upload/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      fetchFiles();
    } catch {
      alert("❌ Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (id) => {
    if (!window.confirm("Delete this file?")) return;
    await axios.delete(`${API}/files/delete/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchFiles();
  };

  const shareWhatsApp = (fileId, filename) => {
    const link = `${API}/files/download/${fileId}/`;
    const msg = `📄 ${filename}\nDownload:\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const shareGmail = (file) => {
    const link = `${API}/files/download/${file.id}/`;
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&su=File Download&body=${encodeURIComponent(
        `Download here:\n${link}`
      )}`,
      "_blank"
    );
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="dashboard">
      <div className="header">
        <h3>📄 File Converter Dashboard</h3>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <div className="upload-box">
        <input type="file" onChange={handleUpload} />
        {uploading && <span>Uploading...</span>}
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="file-list">
          {files.map((file) => (
            <div key={file.id} className="file-card">
              <span>{file.filename}</span>
              <FaWhatsapp onClick={() => shareWhatsApp(file.id, file.filename)} />
              <FaEnvelope onClick={() => shareGmail(file)} />
              <FaTrash onClick={() => deleteFile(file.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
