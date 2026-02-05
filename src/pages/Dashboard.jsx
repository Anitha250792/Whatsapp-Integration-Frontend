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
    fetchFiles(); // initial load

    const interval = setInterval(fetchFiles, 5000); // polling
    return () => clearInterval(interval);
  }, []);

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
    try {
      const res = await axios.get(`${API}/files/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Polling failed", err);
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
      showToast("PDF split completed", "success");
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

  const shareWhatsApp = (file) => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        `📄 ${file.filename}\nDownload:\n${file.public_url}`
      )}`,
      "_blank"
    );
  };

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
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div className="whatsapp-box">
        <h4>📲 WhatsApp Integration</h4>
        <input
          placeholder="WhatsApp number with country code"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
        />
        <label>
          <input
            type="checkbox"
            checked={whatsappEnabled}
            onChange={() => setWhatsappEnabled(!whatsappEnabled)}
          />
          Enable WhatsApp delivery
        </label>
        <button onClick={saveWhatsapp}>Save</button>
      </div>

      <div className="upload-box">
        <input type="file" onChange={handleUpload} />
        {uploading && <span>Uploading...</span>}
      </div>

      <div className="bulk-actions">
        <button disabled={selectedIds.length !== 1} onClick={convertWordToPDF}>
          Word → PDF
        </button>
        <button disabled={selectedIds.length !== 1} onClick={convertPDFToWord}>
          PDF → Word
        </button>
        <button disabled={selectedIds.length < 2} onClick={mergePDFs}>
          Merge PDFs
        </button>
        <button disabled={selectedIds.length !== 1} onClick={splitPDF}>
          Split PDF
        </button>

        <input
          placeholder="Signer name"
          value={signer}
          onChange={(e) => setSigner(e.target.value)}
        />
        <button disabled={selectedIds.length !== 1} onClick={signPDF}>
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
                <span>{file.filename}</span>
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
