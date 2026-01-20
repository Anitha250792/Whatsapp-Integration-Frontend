import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaFacebook, FaEye, FaEyeSlash } from "react-icons/fa";
import "./Login.css";

const API = "https://whatsapp-integration-u7tq.onrender.com";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* 🔐 LOCAL LOGIN */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API}/accounts/login/`, {
        email,
        password,
      });

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  /* 🔐 GOOGLE LOGIN — REDIRECT (CORRECT WAY) */
  const googleLogin = () => {
    window.location.href =
      "https://whatsapp-integration-u7tq.onrender.com/accounts/google/login/";
  };

  const facebookLogin = () => {
    window.location.href =
      "https://whatsapp-integration-u7tq.onrender.com/accounts/facebook/login/";
  };


  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">Login</h2>

        {/* 🔹 Social Login */}
        <div className="social-grid">
  <button className="google-btn" onClick={googleLogin}>
    Login with Google
  </button>

  <button className="facebook-btn" onClick={facebookLogin}>
    Login with Facebook
  </button>
</div>


        <div className="divider">or</div>

        {/* 🔹 Local Login */}
        <form onSubmit={handleLogin}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="register-text">
          Don’t have an account?{" "}
          <span onClick={() => navigate("/register")}>Create Account</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
