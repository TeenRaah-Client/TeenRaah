import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import api, { setAdminKey } from "../api/axios";
import { getSocket, disconnectSocket } from "../api/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Start the socket connection after authentication.
   */
  const bootstrapSocket = useCallback(() => {
    const socket = getSocket();

    if (!socket.connected) {
      socket.connect();
    }
  }, []);

  /**
   * Restore the authenticated session when the application starts.
   *
   * axios.js automatically restores the admin key from sessionStorage,
   * so there is no need to access sessionStorage here.
   */
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } = await api.get("/auth/me");

        if (data?.user) {
          setUser(data.user);
          bootstrapSocket();
        } else {
          setUser(null);
          setAdminKey(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, [bootstrapSocket]);

  /**
   * Register a new customer account.
   */
  const register = async ({
    name,
    email,
    password,
    phone,
    referralCode,
  }) => {
    const { data } = await api.post("/auth/register", {
      name,
      email,
      password,
      phone,
      referralCode,
    });

    return data;
  };

  /**
   * Verify registration OTP.
   */
  const verifyOtp = async ({ email, otp }) => {
    const { data } = await api.post("/auth/verify-otp", {
      email,
      otp,
    });

    setUser(data.user);
    bootstrapSocket();

    return data;
  };

  /**
   * Resend registration OTP.
   */
  const resendOtp = async (email) => {
    const { data } = await api.post("/auth/resend-otp", {
      email,
    });

    return data;
  };

  /**
   * Customer login.
   */
  const login = async ({ email, password }) => {
    const { data } = await api.post("/auth/login", {
      email,
      password,
    });

    setUser(data.user);
    bootstrapSocket();

    return data;
  };

  /**
   * Admin login.
   *
   * The backend returns:
   * {
   *   user,
   *   adminKey
   * }
   *
   * setAdminKey() stores the key through axios.js and makes it
   * available to all subsequent /api/admin/* requests.
   */
  const adminLogin = async ({ email, password }) => {
    const { data } = await api.post("/auth/admin-login", {
      email,
      password,
    });

    if (!data?.user || data.user.role !== "admin") {
      setAdminKey(null);
      throw new Error("Invalid admin account");
    }

    if (!data.adminKey) {
      setAdminKey(null);
      throw new Error("Admin authentication key was not provided");
    }

    setUser(data.user);
    setAdminKey(data.adminKey);

    bootstrapSocket();

    return data;
  };

  /**
   * Logout current user/admin.
   */
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Logout locally even if the server request fails.
    } finally {
      setAdminKey(null);
      disconnectSocket();
      setUser(null);
    }
  };

  /**
   * Refresh current authenticated user.
   */
  const refreshUser = async () => {
    const { data } = await api.get("/auth/me");

    if (data?.user) {
      setUser(data.user);
    }

    return data.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === "admin",

        register,
        verifyOtp,
        resendOtp,
        login,
        adminLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};