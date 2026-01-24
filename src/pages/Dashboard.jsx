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

/* 🔓 Decode JWT */
const getUserFromToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

/* 🅰️ Generate initials */
const getInitials = (name = "") => {
  if (!name) return "U";
  const parts = name.split(" ");
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[1][0]).toUpperCase();
};

const Dashboard = () => {
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [signer, setSigner] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [initials, setInitials] = useState("");

  const token = localStorage.getItem("access");

  /* 🔐 Protect dashboard */
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const user = getUserFromToken(token);
    const name = user?.name || user?.email || "User";

    setUsername(name);
    setInitials(getInitials(name));

    fetchFiles();
  }, []);

  /* 📂 Fetch files */
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
      }
    } finally {
      setLoading(false);
    }
  };

  /* ⬆ Upload */
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${API}/files/upload/`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFiles();
    } catch {
      alert("❌ Upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* ☑ Select */
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /* ❌ Delete */
  const deleteFile = async (id) => {
    if (!window.confirm("Delete this file?")) return;
    await axios.delete(`${API}/files/delete/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchFiles();
  };

  /* ⬇ Download */
  const downloadFile = async (url, filename) => {
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "blob",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([res.data]));
    link.download = filename;
    link.click();
  };

  /* 🔄 Convert */
  const convertWordToPDF = (id) =>
    downloadFile(`${API}/files/convert/word-to-pdf/${id}/`, "converted.pdf");

  const convertPDFToWord = (id) =>
    downloadFile(`${API}/files/convert/pdf-to-word/${id}/`, "converted.docx");

  /* 📲 Share */
  const shareWhatsApp = (file) => {
    const msg = `📄 ${file.filename}\nDownload:\n${file.public_url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  const shareGmail = (file) => {
    const link = `${API}/files/download/${file.id}/`;
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&body=${encodeURIComponent(link)}`
    );
  };

  /* 🚪 Logout */
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="dashboard">
      {/* ===== HEADER ===== */}
      <div className="header">
        <div className="header-left">
          <div className="avatar">{initials}</div>
          <div>
            <h3>📄 File Converter Dashboard</h3>
            <p className="username">Welcome, {username}</p>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* ===== UPLOAD ===== */}
      <div className="upload-box">
        <input type="file" onChange={handleUpload} />
        {uploading && <span>Uploading...</span>}
      </div>

      {/* ===== FILE LIST ===== */}
      {loading ? (
        <p className="loading">Loading files...</p>
      ) : (
        <div className="file-list">
          {files.map((file) => (
            <div className="file-card" key={file.id}>
              <input
                type="checkbox"
                checked={selectedIds.includes(file.id)}
                onChange={() => toggleSelect(file.id)}
              />

              <div className="file-info">
                {file.filename.endsWith(".pdf") ? (
                  <FaFilePdf />
                ) : (
                  <FaFileWord />
                )}
                <span>{file.filename}</span>
              </div>

              <div className="actions">
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
                <FaWhatsapp onClick={() => shareWhatsApp(file)} />
                <FaEnvelope onClick={() => shareGmail(file)} />
                <FaTrash onClick={() => deleteFile(file.id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
