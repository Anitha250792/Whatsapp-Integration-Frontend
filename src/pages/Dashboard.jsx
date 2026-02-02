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

  const [files, setFiles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [signer, setSigner] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔥 NEW – conversion loader
  const [converting, setConverting] = useState(false);
  const [convertingText, setConvertingText] = useState("");

  const [username, setUsername] = useState("User");
  const [initials, setInitials] = useState("U");

  const token = localStorage.getItem("access");

  /* 🔐 Protect dashboard */
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchUserProfile();
    fetchFiles();
  }, []);

  /* 👤 Fetch user */
  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`${API}/dj-rest-auth/user/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const name = res.data.username || res.data.email || "User";
      setUsername(name);
      setInitials(getInitials(name));
    } catch (err) {
      console.error(err);
    }
  };

  /* 📂 Fetch files */
  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${API}/files/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles(Array.isArray(res.data) ? res.data : []);
    } catch {
      setFiles([]);
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
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* 🔁 Word → PDF */
  const convertWordToPDF = async (id) => {
    try {
      setConverting(true);
      setConvertingText("Converting Word → PDF...");

      const res = await axios.post(
        `${API}/files/convert/word-to-pdf/${id}/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      window.open(res.data.public_url, "_blank");

      const msg = `📄 Converted PDF ready:\n${res.data.public_url}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");

      fetchFiles();
    } finally {
      setConverting(false);
      setConvertingText("");
    }
  };

  /* 🔁 PDF → Word */
  const convertPDFToWord = async (id) => {
    try {
      setConverting(true);
      setConvertingText("Converting PDF → Word...");

      const res = await axios.post(
        `${API}/files/convert/pdf-to-word/${id}/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      window.open(res.data.public_url, "_blank");

      const msg = `📄 Converted Word file:\n${res.data.public_url}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");

      fetchFiles();
    } finally {
      setConverting(false);
      setConvertingText("");
    }
  };

  /* ➕ Merge PDFs */
  const mergePDFs = async () => {
    if (selectedIds.length < 2) {
      alert("Select at least 2 PDFs");
      return;
    }

    const res = await axios.post(
      `${API}/files/merge/`,
      { file_ids: selectedIds },
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      }
    );

    const url = URL.createObjectURL(new Blob([res.data]));
    window.open(url);
  };

  /* ✂ Split PDF */
  const splitPDF = async () => {
    const res = await axios.post(
      `${API}/files/split/${selectedIds[0]}/`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      }
    );

    const url = URL.createObjectURL(new Blob([res.data]));
    window.open(url);
  };

  /* ✍ Sign PDF */
  const signPDF = async () => {
    const res = await axios.post(
      `${API}/files/sign/${selectedIds[0]}/`,
      { signer },
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      }
    );

    const url = URL.createObjectURL(new Blob([res.data]));
    window.open(url);
  };

  /* 📲 WhatsApp share */
  const shareWhatsApp = (file) => {
    const publicLink = `${API}/files/public/${file.public_token}/`;
    const msg = `📄 ${file.filename}\nDownload:\n${publicLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  /* ❌ Delete */
  const deleteFile = async (id) => {
    if (!window.confirm("Delete this file?")) return;
    await axios.delete(`${API}/files/delete/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchFiles();
  };

  /* 🚪 Logout */
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="dashboard">
      {/* 🔥 CONVERSION LOADER */}
      {converting && (
        <div className="conversion-overlay">
          <div className="loader"></div>
          <p>{convertingText}</p>
        </div>
      )}

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

      <div className="upload-box">
        <input type="file" onChange={handleUpload} />
        {uploading && <span>Uploading...</span>}
      </div>

      <div className="bulk-actions">
        <button onClick={mergePDFs} disabled={converting}>Merge PDFs</button>
        <button onClick={splitPDF} disabled={converting}>Split PDF</button>
        <input
          placeholder="Signer name"
          value={signer}
          onChange={(e) => setSigner(e.target.value)}
        />
        <button onClick={signPDF} disabled={converting}>Sign PDF</button>
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
                {file.filename.endsWith(".docx") && (
                  <button
                    disabled={converting}
                    onClick={() => convertWordToPDF(file.id)}
                  >
                    Word → PDF
                  </button>
                )}

                {file.filename.endsWith(".pdf") && (
                  <button
                    disabled={converting}
                    onClick={() => convertPDFToWord(file.id)}
                  >
                    PDF → Word
                  </button>
                )}

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
