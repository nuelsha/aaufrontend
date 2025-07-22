import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserIcon,
  PencilIcon,
  KeyIcon,
  ClockIcon,
  ArrowRightEndOnRectangleIcon,
} from "@heroicons/react/24/outline";
import NavBar from "../components/NavBar";
import { useUser } from "../context/UserContext";
import { updateUser } from "../api";
import toast from "react-hot-toast";
import { getUserActivityLogs } from "../api";

const Profile = () => {
  const { user: contextUser, logout, setContextUser } = useUser();
  const navigate = useNavigate();

  const [user, setUser] = useState({
    name: "",
    email: "",
    role: "",
    department: "Partnership Office",
    joinDate: new Date().toISOString(),
    profileImage: null,
  });

  // Modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: contextUser?.firstName || "",
    lastName: contextUser?.lastName || "",
    email: contextUser?.email || "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Activity log modal state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState("");

  useEffect(() => {
    if (contextUser) {
      setUser({
        name: `${contextUser.firstName || ""} ${contextUser.lastName || ""}`.trim(),
        email: contextUser.email || "",
        role: contextUser.role || "User",
        department: contextUser.campusId ? "Department" : "Partnership Office",
        joinDate: new Date().toISOString(),
        profileImage: null,
      });
      setEditForm({
        firstName: contextUser.firstName || "",
        lastName: contextUser.lastName || "",
        email: contextUser.email || "",
      });
    }
  }, [contextUser]);

  const [auditLogs, setAuditLogs] = useState([
    {
      id: 1,
      action: "Logged in",
      timestamp: "2023-06-15T10:30:00",
      details: "User logged in from 192.168.1.1",
    },
    {
      id: 2,
      action: "Updated partnership",
      timestamp: "2023-06-14T14:45:00",
      details: "Modified Turkish Foundation partnership details",
    },
    {
      id: 3,
      action: "Added new user",
      timestamp: "2023-06-12T09:15:00",
      details: "Created account for David Kim",
    },
    {
      id: 4,
      action: "Changed password",
      timestamp: "2023-06-10T16:20:00",
      details: "User changed their password",
    },
    {
      id: 5,
      action: "Exported report",
      timestamp: "2023-06-08T11:05:00",
      details: "Generated partnership status report",
    },
  ]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Edit Profile handlers
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    try {
      // Only allow update if contextUser exists
      if (!contextUser?._id) throw new Error("User not found");
      const payload = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
      };
      const res = await updateUser(contextUser._id, payload);
      // Update context and localStorage
      const updatedUser = { ...contextUser, ...payload };
      setContextUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setIsEditOpen(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      setEditError(
        err?.response?.data?.message || err.message || "Failed to update profile."
      );
    } finally {
      setEditLoading(false);
    }
  };

  // Fetch all activity logs
  const handleViewAllActivity = async () => {
    setIsActivityModalOpen(true);
    setActivityLoading(true);
    setActivityError("");
    try {
      const res = await getUserActivityLogs({ userId: contextUser?._id, limit: 100 });
      setActivityLogs(res.data.notifications || []);
    } catch (err) {
      setActivityError("Failed to fetch activity logs.");
    } finally {
      setActivityLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <NavBar />
      {/* Edit Profile Modal */}
      {isEditOpen && (
        <>
          <div className="fixed inset-0 z-40 backdrop-blur-sm bg-black/10 transition-all"></div>
          <div className="absolute left-0 right-0 mx-auto z-50 flex justify-center items-start mt-16 pointer-events-none">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md relative pointer-events-auto border border-gray-200">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                onClick={() => setIsEditOpen(false)}
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={editForm.firstName}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={editForm.lastName}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                {editError && <div className="text-red-500 text-sm">{editError}</div>}
                <button
                  type="submit"
                  className="w-full bg-[#004165] text-white py-2 rounded-md hover:bg-[#00334e] transition-colors"
                  disabled={editLoading}
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
      {/* Activity Log Modal */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setIsActivityModalOpen(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">All Activity Logs</h2>
            {activityLoading ? (
              <div className="py-8 text-center text-gray-500">Loading...</div>
            ) : activityError ? (
              <div className="py-8 text-center text-red-500">{activityError}</div>
            ) : activityLogs.length === 0 ? (
              <div className="py-8 text-center text-gray-500">No activity found.</div>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-gray-200">
                {activityLogs.map((log) => (
                  <div key={log._id || log.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <ClockIcon className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {log.title || log.action || "Activity"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(log.timestamp)}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {log.message || log.details || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Info */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col items-center">
                    <div className="h-24 w-24 bg-[#004165] rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.name}
                          className="h-24 w-24 rounded-full"
                        />
                      ) : (
                        user.name.charAt(0)
                      )}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {user.name}
                    </h2>
                    <p className="text-sm text-gray-500">{user.role}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {user.department}
                    </p>
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center">
                      <div className="w-8 flex-shrink-0 text-gray-500">
                        <UserIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-sm font-medium">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 flex-shrink-0 text-gray-500">
                        <ClockIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Joined</p>
                        <p className="text-sm font-medium">
                          {new Date(user.joinDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    <button
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => setIsEditOpen(true)}
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit Profile
                    </button>
                    <button
                      onClick={() => navigate("/reset-password")}
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <KeyIcon className="h-4 w-4 mr-2" />
                      Change Password
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <ArrowRightEndOnRectangleIcon className="w-5 h-5 mr-2" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Logs */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Activity Log
                  </h2>
                  <p className="text-sm text-gray-500">
                    Recent actions performed by you in the system
                  </p>
                </div>
                <div className="divide-y divide-gray-200">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <ClockIcon className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {log.action}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(log.timestamp)}
                            </p>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">
                            {log.details}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {auditLogs.length >= 5 && (
                  <div className="px-6 py-4 border-t border-gray-200 text-center">
                    <button
                      className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                      onClick={handleViewAllActivity}
                    >
                      View all activity
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
