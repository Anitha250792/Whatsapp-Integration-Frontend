import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaWhatsapp,
  FaTrash,
  FaFilePdf,
  FaFileWord,
  FaDownload,
  FaCopy,
} from "react-icons/fa";
import "./Dashboard.css";

const API = "https://whatsapp-integration-u7tq.onrender.com";

const getInitials = (name = "") =>
  name ? name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase() : "U";

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

  /* ---------- helpers ---------- */

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const downloadFile = (file) => {
    window.open(file.public_url, "_blank");
  };

  const copyLink = async (file) => {
    try {
      await navigator.clipboard.writeText(file.public_url);
      showToast("Link copied", "success");
    } catch {
      showToast("Failed to copy link", "error");
    }
  };

  const shareWhatsApp = (file) => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        `📄 ${file.filename}\nDownload:\n${file.public_url}`
      )}`,
      "_blank"
    );
  };

  /* ---------- auth ---------- */

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchUser();
    fetchFiles();
  }, []);

  const fetchUser = async () => {
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

  /* ---------- files ---------- */

  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${API}/files/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles(res.data || []);
    } catch {
      showToast("Failed to load files", "error");
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
      showToast("File uploaded", "success");
      fetchFiles();
    } catch {
      showToast("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  /* ---------- pdf tools ---------- */

  const mergePDFs = async () => {
    if (selectedIds.length < 2)
      return showToast("Select at least 2 PDFs", "info");

    await axios.post(
      `${API}/files/merge/`,
      { file_ids: selectedIds },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    showToast("Merged successfully", "success");
    fetchFiles();
  };

  const splitPDF = async () => {
    if (selectedIds.length !== 1)
      return showToast("Select one PDF", "info");

    await axios.post(
      `${API}/files/split/${selectedIds[0]}/`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    showToast("Split completed", "success");
    fetchFiles();
  };

  const signPDF = async () => {
    if (selectedIds.length !== 1)
      return showToast("Select one PDF", "info");

    await axios.post(
      `${API}/files/sign/${selectedIds[0]}/`,
      { signer },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    showToast("Signed successfully", "success");
    fetchFiles();
  };

  /* ---------- UI ---------- */

  return (
    <div className="dashboard">
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <div className="header">
        <div className="avatar">{initials}</div>
        <div>
          <h3>📄 File Converter Dashboard</h3>
          <p>Welcome, {username}</p>
        </div>
        <button onClick={() => navigate("/login")}>Logout</button>
      </div>

      <div className="upload-box">
        <input type="file" onChange={handleUpload} />
        {uploading && <span>Uploading…</span>}
      </div>

      <div className="bulk-actions">
        <button onClick={mergePDFs}>Merge PDFs</button>
        <button onClick={splitPDF}>Split PDF</button>
        <input
          placeholder="Signer name"
          value={signer}
          onChange={(e) => setSigner(e.target.value)}
        />
        <button onClick={signPDF}>Sign PDF</button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="file-list">
          {files.map((file) => (
            <div className="file-card" key={file.id}>
              <input
                type="checkbox"
                checked={selectedIds.includes(file.id)}
                onChange={() =>
                  setSelectedIds((p) =>
                    p.includes(file.id)
                      ? p.filter((x) => x !== file.id)
                      : [...p, file.id]
                  )
                }
              />

              <div className="file-info">
                {file.filename.endsWith(".pdf") ? <FaFilePdf /> : <FaFileWord />}
                <span>{file.filename}</span>
              </div>

              <div className="actions">
                <FaDownload onClick={() => downloadFile(file)} />
                <FaCopy onClick={() => copyLink(file)} />
                <FaWhatsapp onClick={() => shareWhatsApp(file)} />
                <FaTrash
                  onClick={async () => {
                    await axios.delete(
                      `${API}/files/delete/${file.id}/`,
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    fetchFiles();
                  }}
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
