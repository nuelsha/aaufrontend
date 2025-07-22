import React, { useState, useEffect } from "react";
import {
  BellIcon,
  CheckCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import NavBar from "../components/NavBar";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../api";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  const filterToTypeMap = {
    all: null,
    unread: null,
    partnership: "Partnerships",
    system: "System",
    alert: "Alerts",
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = { limit: pagination.limit, page: pagination.page };

        if (filter === "unread") {
          params.isRead = false;
        } else if (filter !== "all") {
          params.type = filterToTypeMap[filter];
        }

        const response = await getNotifications(params);
        setNotifications(response.data.notifications || []);
        setPagination(
          response.data.pagination || { page: 1, limit: 20, total: 0, pages: 1 }
        );
      } catch (err) {
        setError("Failed to fetch notifications. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [filter, pagination.page, pagination.limit]);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(
        notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications(notifications.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const formatDate = (dateString) => {
    const options = {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="p-8 text-center text-gray-500">
          Loading notifications...
        </div>
      );
    }
    if (error) {
      return (
        <div className="p-8 text-center text-red-500">
          {error}
          <button
            onClick={() => setFilter(filter)}
            className="ml-4 text-sm text-blue-600 hover:text-blue-800"
          >
            Retry
          </button>
        </div>
      );
    }
    if (notifications.length === 0) {
      return (
        <div className="p-8 text-center text-gray-500">
          <BellIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p>You have no notifications.</p>
        </div>
      );
    }
    return (
      <ul className="divide-y divide-gray-200">
        {notifications.map((notification) => (
          <li
            key={notification._id}
            className={`p-4 transition-colors duration-200 ${
              !notification.isRead ? "bg-blue-50" : "bg-white"
            } hover:bg-gray-50`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    !notification.isRead
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <BellIcon className="h-5 w-5" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(notification.timestamp)}
                  </p>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {notification.message}
                </p>
                <div className="mt-2 flex space-x-2">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification._id)}
                      className="flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Mark as read
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteNotification(notification._id)}
                    className="flex items-center text-xs font-semibold text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <NavBar />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Mark all as read
            </button>
          </div>
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === "all"
                  ? "bg-[#004165] text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === "unread"
                  ? "bg-[#004165] text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter("partnership")}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === "partnership"
                  ? "bg-[#004165] text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              Partnerships
            </button>
            <button
              onClick={() => setFilter("system")}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === "system"
                  ? "bg-[#004165] text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              System
            </button>
            <button
              onClick={() => setFilter("alert")}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === "alert"
                  ? "bg-[#004165] text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              Alerts
            </button>
          </div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {renderContent()}
          </div>
          {pagination.pages > 1 && (
            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
