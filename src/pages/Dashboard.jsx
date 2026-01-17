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

  const [files, setFiles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [signer, setSigner] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("access");

  /* 🔐 Protect dashboard */
  useEffect(() => {
    if (!token) navigate("/login");
    else fetchFiles();
    // eslint-disable-next-line
  }, []);

  /* 📂 Fetch files */
  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${API}/api/files/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles(res.data);
    } catch (err) {
      handleLogout();
    } finally {
      setLoading(false);
    }
  };
  
  const downloadFile = async (url, filename) => {
  const res = await axios.post(url, {}, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: "blob",
  });

  const blob = new Blob([res.data]);
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

  /* ⬆ Upload */
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    await axios.post(`${API}/api/files/upload/`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setUploading(false);
    fetchFiles();
  };

  /* ☑ Select files */
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /* ❌ Delete */
  const deleteFile = async (id) => {
    if (!window.confirm("Delete this file?")) return;

    await axios.delete(`${API}/api/files/delete/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchFiles();
  };

  /* 🔁 STREAMING CONVERSIONS (IMPORTANT FIX) */
  const convertWordToPDF = (id) => {
  downloadFile(
    `${API}/api/files/convert/word-to-pdf/${id}/`,
    "converted.pdf"
  );
};

const convertPDFToWord = (id) => {
  downloadFile(
    `${API}/api/files/convert/pdf-to-word/${id}/`,
    "converted.docx"
  );
};

const mergePDFs = () => {
  if (selectedIds.length < 2) {
    alert("Select at least 2 PDFs");
    return;
  }

  axios.post(
    `${API}/api/files/merge/`,
    { file_ids: selectedIds },
    {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "blob",
    }
  ).then(res => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(res.data);
    link.download = "merged.pdf";
    link.click();
  });

  setSelectedIds([]);
};

const splitPDF = () => {
  if (selectedIds.length !== 1) {
    alert("Select one PDF");
    return;
  }

  axios.post(
    `${API}/api/files/split/${selectedIds[0]}/`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "blob",
    }
  ).then(res => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(res.data);
    link.download = "split_pages.zip";
    link.click();
  });

  setSelectedIds([]);
};

const signPDF = () => {
  if (selectedIds.length !== 1 || !signer) {
    alert("Enter signer name");
    return;
  }

  axios.post(
    `${API}/api/files/sign/${selectedIds[0]}/`,
    { signer },
    {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "blob",
    }
  ).then(res => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(res.data);
    link.download = "signed.pdf";
    link.click();
  });

  setSigner("");
  setSelectedIds([]);
};

  /* 📤 Share */
  const shareWhatsApp = (filename) => {
    const msg = `📄 ${filename}\nShared via File Converter App\n${API}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const shareGmail = (filename) => {
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&su=Shared File&body=${encodeURIComponent(
        filename + "\n" + API
      )}`,
      "_blank"
    );
  };

  /* 🚪 Logout */
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
        {uploading && <span>Uploading...</span>}
      </div>

      {/* BULK ACTIONS */}
      <div className="bulk-actions">
        <button onClick={mergePDFs}>Merge PDFs</button>
        <button onClick={splitPDF}>Split PDF</button>

        <input
          type="text"
          placeholder="Signer name"
          value={signer}
          onChange={(e) => setSigner(e.target.value)}
        />
        <button onClick={signPDF}>Sign PDF</button>
      </div>

      {/* FILE LIST */}
      {loading ? (
        <p className="loading">Loading files...</p>
      ) : (
        <div className="file-list">
          {files.length === 0 && <p>No files uploaded</p>}

          {files.map((file) => (
            <div className="file-card" key={file.id}>
              <input
                type="checkbox"
                checked={selectedIds.includes(file.id)}
                onChange={() => toggleSelect(file.id)}
              />

              <div className="file-info">
                {file.filename.endsWith(".pdf") ? (
                  <FaFilePdf className="file-icon pdf" />
                ) : (
                  <FaFileWord className="file-icon word" />
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

                <FaWhatsapp onClick={() => shareWhatsApp(file.filename)} />
                <FaEnvelope onClick={() => shareGmail(file.filename)} />
                <FaTrash
                  className="delete"
                  onClick={() => deleteFile(file.id)}
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
