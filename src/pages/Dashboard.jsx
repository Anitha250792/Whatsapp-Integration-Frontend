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

/* 🔐 Render-safe flags */
const CONVERSION_ENABLED = false;

/* 🅰️ Initials */
const getInitials = (name = "") => {
  if (!name) return "U";
  const p = name.split(" ");
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[1][0]).toUpperCase();
};

/* 🏷 Labels */
const getOperationLabel = (filename) => {
  if (filename.includes("_signed")) return "Signed";
  if (filename.startsWith("merged_")) return "Merged";
  if (filename.endsWith(".zip")) return "Split";
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  const [files, setFiles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [signer, setSigner] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("User");
  const [initials, setInitials] = useState("U");

  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  const [toast, setToast] = useState(null);

  /* 🔔 Toast */
  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* 🔐 Auth + Polling */
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchUser();
    fetchFiles();

    const interval = setInterval(() => {
      if (localStorage.getItem("access")) fetchFiles();
    }, 5000);

    return () => clearInterval(interval);
  }, [token]);

  /* 🧹 Reset selection */
  useEffect(() => setSelectedIds([]), [files]);

  /* 👤 User */
  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API}/dj-rest-auth/user/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const name = res.data.username || res.data.email;
      setUsername(name);
      setInitials(getInitials(name));
    } catch {
      localStorage.clear();
      navigate("/login");
    }
  };

  /* 📂 Files */
  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${API}/files/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles(res.data || []);
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
    const fd = new FormData();
    fd.append("file", file);

    try {
      await axios.post(`${API}/files/upload/`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("File uploaded", "success");
      fetchFiles();
    } catch {
      showToast("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  /* 🔁 Conversions (Disabled) */
  const conversionDisabled = () =>
    showToast("Conversion disabled on this server", "info");

  /* 🧩 PDF Tools */
  const mergePDFs = async () => {
    try {
      await axios.post(
        `${API}/files/merge/`,
        { file_ids: selectedIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("PDFs merged", "success");
      fetchFiles();
    } catch {
      showToast("Merge failed", "error");
    }
  };

  const splitPDF = async () => {
    try {
      await axios.post(
        `${API}/files/split/${selectedIds[0]}/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("PDF split (ZIP)", "success");
      fetchFiles();
    } catch {
      showToast("Split failed", "error");
    }
  };

  const signPDF = async () => {
    try {
      await axios.post(
        `${API}/files/sign/${selectedIds[0]}/`,
        { signer },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("PDF signed & sent on WhatsApp", "success");
      fetchFiles();
    } catch {
      showToast("Signing failed", "error");
    }
  };

  /* 📲 WhatsApp */
  const saveWhatsapp = async () => {
    try {
      await axios.post(
        `${API}/accounts/update-whatsapp/`,
        { whatsapp_number: whatsapp, whatsapp_enabled: whatsappEnabled },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("WhatsApp saved", "success");
    } catch (e) {
      showToast(e.response?.data?.error || "Invalid number", "error");
    }
  };

  const shareWhatsApp = (file) =>
    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        `📄 ${file.filename}\n${file.public_url}`
      )}`,
      "_blank"
    );

  const deleteFile = async (id) => {
    if (!window.confirm("Delete this file?")) return;
    await axios.delete(`${API}/files/delete/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchFiles();
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  /* ================= UI ================= */

  return (
    <div className="dashboard">
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div className="header">
        <div className="header-left">
          <div className="avatar">{initials}</div>
          <div>
            <h3>📄 File Converter Dashboard</h3>
            <p>Welcome, {username}</p>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>Logout</button>
      </div>

      {/* 📲 WhatsApp */}
      <div className="whatsapp-box">
        <h4>📲 WhatsApp Integration</h4>
        <input
          placeholder="+91 9876543210"
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

      {/* ⬆ Upload */}
      <div className="upload-box">
        <label className="upload-label">
          <input type="file" hidden onChange={handleUpload} />
          📂 Click to choose file
        </label>
        {uploading && <p>Uploading…</p>}
      </div>

      {/* 🔧 Actions */}
      <div className="bulk-actions">
        <button disabled={!CONVERSION_ENABLED || selectedIds.length !== 1} onClick={conversionDisabled}>
          Word → PDF
        </button>

        <button disabled={!CONVERSION_ENABLED || selectedIds.length !== 1} onClick={conversionDisabled}>
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
          disabled={selectedIds.length !== 1}
        />

        <button disabled={selectedIds.length !== 1} onClick={signPDF}>
          Sign PDF
        </button>
      </div>

      {/* 📂 File List */}
      {loading ? (
        <p className="loading">Loading…</p>
      ) : (
        <div className="file-list">
          {files.map((f) => (
            <div className="file-card" key={f.id}>
              <input
                type="checkbox"
                checked={selectedIds.includes(f.id)}
                onChange={() =>
                  setSelectedIds((p) =>
                    p.includes(f.id) ? p.filter((x) => x !== f.id) : [...p, f.id]
                  )
                }
              />

              <div className="file-info">
                {f.filename.endsWith(".pdf") ? <FaFilePdf /> : <FaFileWord />}
                <span>
                  {f.filename}
                  {getOperationLabel(f.filename) && (
                    <span className="badge op">{getOperationLabel(f.filename)}</span>
                  )}
                </span>
              </div>

              <div className="actions">
                <a href={f.public_url} target="_blank" rel="noreferrer">Download</a>
                <FaWhatsapp onClick={() => shareWhatsApp(f)} />
                <FaTrash onClick={() => deleteFile(f.id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
