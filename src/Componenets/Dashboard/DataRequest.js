"use client";
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Users, Mail, Phone, MessageSquare, DollarSign, Hash, Trash2 } from "lucide-react";
import { deleteRequestById, fetchRequest } from "@/services/api";

export default function DatasetRequests() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetchRequest();
        
        // Handle different response structures
        let requests = [];
        if (Array.isArray(response)) {
          requests = response;
        } else if (response && Array.isArray(response.data)) {
          requests = response.data;
        } else if (response && response.results) {
          requests = response.results;
        } else if (response && response.data) {
          requests = response.data;
        }
        
        setData(requests);
        if (requests.length > 0) {
          toast.success(`Loaded ${requests.length} requests`);
        } else {
          toast("No requests found", { icon: "ℹ️" });
        }
      } catch (err) {
        console.error('Error fetching requests:', err);
        setError(err.message || "Failed to load data");
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Delete request function
  const handleDeleteRequest = async (id) => {
  if (!confirm("Are you sure you want to delete this request? This action cannot be undone.")) {
    return;
  }

  try {
    setDeletingId(id);
    
    const result = await deleteRequestById(id);

    if (result.ok) {
      setData(prevData => prevData.filter(item => item.id !== id && item._id !== id));
      toast.success("Request deleted successfully");
    } else {
      toast.error(result.message || "Failed to delete request");
    }
  } catch (error) {
    console.error("Error deleting request:", error);
    toast.error("Failed to delete request. Please try again.");
  } finally {
    setDeletingId(null);
  }
};
  // Safe filtering with fallbacks
  const filteredData = data
    .filter(item => {
      const name = item?.fullName || "";
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .map(item => ({
      id: item?.id || item?._id || Math.random().toString(36).substring(2, 9),
      fullName: item?.fullName || item?.name || "Unknown",
      email: item?.email || "N/A",
      phone: item?.phone || item?.phoneNumber || "",
      contactCount: item?.contactCount || item?.count || 0,
      price: item?.price || item?.amount || 0,
      message: item?.message || item?.notes || "No message",
      createdAt: item?.createdAt || item?.date || item?.timestamp || item?._id || null
    }));

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0);
  };

  const formatPhone = (phone) => {
    if (!phone) return "N/A";
    const phoneStr = phone.toString().replace(/\D/g, '');
    return phoneStr.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
  };

  // Format date for display
  const formatDate = (date) => {
    // Handle null/undefined cases
    if (!date || date === "N/A" || date === "null" || date === "undefined") {
      return "N/A";
    }
    
    try {
      let dateObj;
      
      // Handle different date formats
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        // Handle various string formats
        if (date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          // ISO date string
          dateObj = new Date(date);
        } else if (date.match(/^\d{13}$/)) {
          // Timestamp in milliseconds
          dateObj = new Date(parseInt(date));
        } else if (date.match(/^\d{10}$/)) {
          // Timestamp in seconds
          dateObj = new Date(parseInt(date) * 1000);
        } else if (date.length === 24 && /^[0-9a-fA-F]+$/.test(date)) {
          // MongoDB ObjectId - extract timestamp
          try {
            const timestamp = parseInt(date.substring(0, 8), 16) * 1000;
            dateObj = new Date(timestamp);
          } catch (e) {
            // If ObjectId parsing fails, try general parsing
            dateObj = new Date(date);
          }
        } else {
          // Try to parse as a general date string
          dateObj = new Date(date);
        }
      } else if (typeof date === 'number') {
        // Handle timestamp (milliseconds)
        dateObj = new Date(date);
      } else {
        // Fallback: try to convert to string and parse
        dateObj = new Date(date.toString());
      }
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return "Invalid Date";
      }
      
      // Format the date
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', date, error);
      return "Invalid Date";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading dataset requests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Users className="h-16 w-16 text-gray-400" />
          <h3 className="text-xl font-medium text-gray-900">No Dataset Requests Found</h3>
          <p className="text-gray-600 max-w-md">
            There are currently no dataset requests available. Check back later or create a new request.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#1e477f] text-white rounded-lg hover:bg-[#1e477f] transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-[#1e477f]" />
              Dataset Requests
            </h1>
            <p className="text-gray-600 mt-1">Manage and view all dataset requests</p>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e477f] focus:border-transparent outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-[#1e477f]" />
              <div className="ml-3">
                <p className="text-sm font-medium text-[#1e477f]">Total Requests</p>
                <p className="text-2xl font-bold text-[#1e477f]">{filteredData.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Full Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Hash className="h-4 w-4 inline mr-1" />
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                  <MessageSquare className="h-4 w-4 inline mr-1" />
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length > 0 ? (
                filteredData.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-[#1e477f]">
                              {request.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {request.fullName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatPhone(request.phone)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(request.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="text-sm text-gray-900 whitespace-normal break-words"
                        style={{
                          maxWidth: "500px",
                          minWidth: "150px",
                          width: "auto"
                        }}
                      >
                        {request.message}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteRequest(request.id)}
                        disabled={deletingId === request.id}
                        className="inline-flex items-center p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete request"
                      >
                        {deletingId === request.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <svg
                        className="h-12 w-12 text-gray-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No matching requests found
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Your search &quot;{searchTerm}&quot; didn&apos;t match any requests
                      </p>
                      <button
                        onClick={() => setSearchTerm("")}
                        className="px-4 py-2 bg-[#1e477f] text-white rounded-lg hover:bg-[#1e477f] transition-colors"
                      >
                        Clear search
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Results count */}
        {filteredData.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{filteredData.length}</span> requests
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-sm text-[#1e477f]"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <Toaster position="top-right" />
    </div>
  );
}