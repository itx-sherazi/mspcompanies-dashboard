"use client";
import { getAdminUsers, deleteAdminUserById } from '@/services/api';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Fetch admin users function
  const loadUsers  = async () => {
    try {
      setLoading(true);
      const usersData = await getAdminUsers();
      setUsers(usersData);
      toast.success('Admin users loaded successfully!');
    } catch (error) {
      console.error('Error fetching admin users:', error);
      toast.error('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  // Delete user function
  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this admin user?')) {
      return;
    }

    try {
      setDeleteLoading(userId);
      await deleteAdminUserById(userId);
      setUsers(prev => prev.filter(user => user._id !== userId));
      toast.success('Admin user deleted successfully!');
    } catch (error) {
      console.error('Error deleting admin user:', error);
      toast.error(`Failed to delete admin user: ${error.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Loading admin users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Users Management</h1>
              <p className="text-gray-600 mt-2">Total Admin Users: {users?.length}</p>
            </div>
            <button
              onClick={loadUsers}
              className="bg-[#1e477f]  text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
            >
              Refresh Users
            </button>
          </div>
        </div>

        {/* Users List */}
        {users.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Admin Users Found</h3>
            <p className="text-gray-500">There are no admin users to display at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <div
                key={user._id || user.id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* User Avatar */}
                    <div className="w-16 h-16 bg-[#1e477f] rounded-full flex items-center justify-center mb-4">
                      <span className="text-white text-xl font-bold">
                        {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* User Info */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user.name || 'No Name'}
                      </h3>
                      <p className="text-gray-600 text-sm break-all">
                         {user.email}
                      </p>
                      {user.role && (
                        <p className="text-gray-500 text-xs">
                          Role: <span className="font-semibold">{user.role}</span>
                        </p>
                      )}
                   
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteUser(user._id || user.id)}
                    disabled={deleteLoading === (user._id || user.id)}
                    className={`ml-4 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                      deleteLoading === (user._id || user.id)
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-[#1e477f] text-white'
                    }`}
                  >
                    {deleteLoading === (user._id || user.id) ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span className="text-sm">Deleting...</span>
                      </div>
                    ) : (
                      <span>🗑️ Delete</span>
                    )}
                  </button>
                </div>

                {/* Additional Info */}
                {user.message && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Message:</span> {user.message}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;