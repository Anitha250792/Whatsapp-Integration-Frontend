import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaWhatsapp,
  FaTrash,
  FaFilePdf,
  FaFileWord,
} from "react-icons/fa";

import "./Dashboard.css";

const API = "https://whatsapp-integration-u7tq.onrender.com";

/* 🅰️ Generate initials */
const getInitials = (name = "") => {
  if (!name) return "U";
  const parts = name.split(" ");
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[1][0]).toUpperCase();
};

/* 🏷 Operation label from filename */
const getOperationLabel = (filename) => {
  if (filename.includes("_signed")) return "Signed";
  if (filename.startsWith("merged_")) return "Merged";
  if (filename.includes("_split")) return "Split";
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  const [files, setFiles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [signer, setSigner] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState(null);
  const [username, setUsername] = useState("User");
  const [initials, setInitials] = useState("U");

  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  /* ================= HELPERS ================= */

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ================= AUTH + POLLING ================= */

  useEffect(() => {
  if (!token) {
    navigate("/login");
    return;
  }

  fetchUserProfile();
  fetchFiles();

  const interval = setInterval(() => {
    const t = localStorage.getItem("access");
    if (t) fetchFiles();
  }, 5000);

  return () => clearInterval(interval);
}, [token]);

  /* Clear selection when file list changes */
  useEffect(() => {
    setSelectedIds([]);
  }, [files]);

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`${API}/dj-rest-auth/user/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const name = res.data.username || res.data.email || "User";
      setUsername(name);
      setInitials(getInitials(name));
    } catch {
      navigate("/login");
    }
  };

  /* ================= FILES ================= */

  const fetchFiles = async () => {
  if (!token) return;

  try {
    const res = await axios.get(`${API}/files/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setFiles(Array.isArray(res.data) ? res.data : []);
  } catch (err) {
    if (err.response?.status === 401) {
      localStorage.clear();
      navigate("/login");
    }
  } finally {
    setLoading(false);
  }
};


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
      showToast("File uploaded successfully", "success");
    } catch {
      showToast("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  /* ================= CONVERSIONS ================= */

  const convertWordToPDF = async () => {
    if (selectedIds.length !== 1) return;
    try {
      await axios.post(
        `${API}/files/convert/word-to-pdf/${selectedIds[0]}/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Word → PDF started (background)", "success");
    } catch {
      showToast("Conversion unavailable", "error");
    }
  };

  const convertPDFToWord = async () => {
    if (selectedIds.length !== 1) return;
    try {
      await axios.post(
        `${API}/files/convert/pdf-to-word/${selectedIds[0]}/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("PDF → Word started (background)", "success");
    } catch {
      showToast("Conversion unavailable", "error");
    }
  };

  /* ================= PDF TOOLS ================= */

  const mergePDFs = async () => {
    if (selectedIds.length < 2) return;
    try {
      await axios.post(
        `${API}/files/merge/`,
        { file_ids: selectedIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("PDFs merged successfully", "success");
    } catch {
      showToast("Merge failed", "error");
    }
  };

  const splitPDF = async () => {
    if (selectedIds.length !== 1) return;
    try {
      await axios.post(
        `${API}/files/split/${selectedIds[0]}/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("PDF split completed (ZIP)", "success");
    } catch {
      showToast("Split failed", "error");
    }
  };

  const signPDF = async () => {
    if (selectedIds.length !== 1) return;
    try {
      await axios.post(
        `${API}/files/sign/${selectedIds[0]}/`,
        { signer },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("PDF signed successfully", "success");
    } catch {
      showToast("Signing failed", "error");
    }
  };

  /* ================= WHATSAPP ================= */



  const saveWhatsapp = async () => {
    try {
      await axios.post(
        `${API}/accounts/update-whatsapp/`,
        {
          whatsapp_number: whatsapp,
          whatsapp_enabled: whatsappEnabled,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("WhatsApp settings saved", "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Invalid number", "error");
    }
  };

  const deleteFile = async (id) => {
    if (!window.confirm("Delete this file?")) return;
    try {
      await axios.delete(`${API}/files/delete/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("File deleted", "success");
    } catch {
      showToast("Delete failed", "error");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  /* ================= UI ================= */

  return (
    <div className="dashboard">
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <div className="header">
        <div className="header-left">
          <div className="avatar">{initials}</div>
          <div>
            <h3>📄 File Converter Dashboard</h3>
            <p>Welcome, {username}</p>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>

      </div>

      {/* 📲 WhatsApp Settings */}
{/* 📲 WhatsApp Settings */}
<div className="whatsapp-box">
  <div className="whatsapp-header">
    <h4>📲 WhatsApp Integration</h4>
    <span className="whatsapp-hint">Get files instantly on WhatsApp</span>
  </div>

  <div className="whatsapp-row">
    <input
      type="text"
      placeholder="+91 98765 43210"
      value={whatsapp}
      onChange={(e) => setWhatsapp(e.target.value)}
    />

    <button onClick={saveWhatsapp}>Save</button>
  </div>

  <label className="whatsapp-toggle">
    <input
      type="checkbox"
      checked={whatsappEnabled}
      onChange={() => setWhatsappEnabled(!whatsappEnabled)}
    />
    Enable WhatsApp delivery
  </label>
</div>

      <div className="upload-box">
  <label className="upload-label">
    <input type="file" onChange={handleUpload} hidden />
    <span>📂 Click to choose file or drag & drop</span>
  </label>

  {uploading && <p className="uploading-text">Uploading…</p>}
</div>


      {/* 🔧 ACTION BUTTONS */}
      <div className="bulk-actions">
  <button
    disabled={selectedIds.length !== 5}
    onClick={convertWordToPDF}
  >
    Word → PDF
  </button>

  <button
    disabled={selectedIds.length !== 5}
    onClick={convertPDFToWord}
  >
    PDF → Word
  </button>

  <button
    disabled={selectedIds.length < 5}
    onClick={mergePDFs}
  >
    Merge PDFs
  </button>

  <button
    disabled={selectedIds.length !== 5}
    onClick={splitPDF}
  >
    Split PDF
  </button>

  <input
    placeholder="Signer name"
    value={signer}
    onChange={(e) => setSigner(e.target.value)}
    disabled={selectedIds.length !== 5}
  />

  <button
    disabled={selectedIds.length !== 5}
    onClick={signPDF}
  >
    Sign PDF
  </button>
</div>


      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="file-list">
          {files.map((file) => (
            <div className="file-card" key={file.id}>
              <input
                type="checkbox"
                checked={selectedIds.includes(file.id)}
                onChange={() =>
                  setSelectedIds((prev) =>
                    prev.includes(file.id)
                      ? prev.filter((x) => x !== file.id)
                      : [...prev, file.id]
                  )
                }
              />

              <div className="file-info">
                {file.filename.endsWith(".pdf") ? <FaFilePdf /> : <FaFileWord />}

                <span>
                  {file.filename}

                  {file.filename.endsWith(".zip") && (
                    <span className="badge zip">ZIP</span>
                  )}

                  {getOperationLabel(file.filename) && (
                    <span className="badge op">
                      {getOperationLabel(file.filename)}
                    </span>
                  )}
                </span>
              </div>

              <div className="actions">
                <a href={file.public_url} target="_blank" rel="noreferrer">
                  Download
                </a>
                <FaWhatsapp onClick={() => shareWhatsApp(file)} />
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
