"use client";
import { useState, useEffect } from "react";
import { deleteBlog, fetchBlog, fetchBlogById } from "../../services/api";
import { Trash2, Search, ChevronLeft, ChevronRight, Tag, FolderOpen, Key, Edit } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";

export default function Blog({ onEdit }) {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBlogs, setTotalBlogs] = useState(0);

  // Function to get the full image URL
  const getImageUrl = (imagePath) => {
    // If no image path, return null
    if (!imagePath) return null;
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) return imagePath;
    
    // If it's a relative path starting with /uploads, prepend the API base URL
    if (imagePath.startsWith('/uploads')) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008';
      return `${baseUrl}${imagePath}`;
    }
    
    // For any other relative path, return null
    return null;
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Fetch blogs with pagination parameters
        const response = await fetchBlog(currentPage, itemsPerPage);
        setData(response.data);
        setFilteredData(response.data);
        setTotalPages(response.totalPages);
        setTotalBlogs(response.totalBlogs);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (isClient) {
      loadData();
    }
  }, [currentPage, itemsPerPage, isClient]);

  // Handle search functionality
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(data);
    } else {
      const filtered = data.filter((blog) =>
        blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (blog.tags && blog.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, data]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Handle delete blog
  const handleDelete = async (blogId) => {
    if (!blogId) {
      toast.error("Blog ID not found");
      return;
    }

    if (window && window.confirm("Are you sure you want to delete this blog?")) {
      try {
        await deleteBlog(blogId);
        // Refetch data after deletion
        const response = await fetchBlog(currentPage, itemsPerPage);
        setData(response.data);
        setFilteredData(response.data);
        setTotalPages(response.totalPages);
        setTotalBlogs(response.totalBlogs);
        toast.success("Blog deleted successfully");
      } catch (err) {
        toast.error("Failed to delete blog");
        console.error("Delete error:", err);
      }
    }
  };

  // Calculate starting index for current page
  const startIndex = (currentPage - 1) * itemsPerPage;

  if (!isClient) return null;

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1e477f]"></div>
      </div>
    );

  if (error)
    return (
      <div className="text-red-500 p-4 bg-red-100 rounded-md">
        Error loading data: {error}
      </div>
    );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Blogs</h1>
        <div className="text-sm text-gray-600">
          Total: {totalBlogs} blogs
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search blogs by title, category, or tags..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e477f] focus:border-[#1e477f]"
          />
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-600">
            Found {filteredData.length} blogs matching &quot;{searchTerm}&quot;
          </p>
        )}
      </div>

      {/* Blogs table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tags
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Keywords
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.length > 0 ? (
              filteredData.map((blog, index) => (
                <tr key={blog._id || `blog-${index}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {blog.image ? (
                      <Image
                        src={getImageUrl(blog.image) || "/placeholder-image.jpg"}
                        width={100}
                        height={100}
                        alt={blog.title || "Blog image"}
                        className="w-24 h-16 object-cover rounded"
                        unoptimized
                      />
                    ) : (
                      <div className="w-24 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {blog.title || "Untitled"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 italic">
                    {blog.slug || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <FolderOpen className="w-4 h-4 mr-1 text-gray-500" />
                      {blog.category || "General"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Tag className="w-4 h-4 mr-1 text-gray-500" />
                      <div className="flex flex-wrap gap-1">
                        {blog.tags && blog.tags.length > 0 ? (
                          blog.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">No tags</span>
                        )}
                        {blog.tags && blog.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{blog.tags.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Key className="w-4 h-4 mr-1 text-gray-500" />
                      <div className="flex flex-wrap gap-1">
                        {blog.keywords && blog.keywords.length > 0 ? (
                          blog.keywords.slice(0, 3).map((keyword, idx) => (
                            <span key={idx} className="text-xs bg-[#1e477f] text-white px-2 py-1 rounded">
                              {keyword}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">No keywords</span>
                        )}
                        {blog.keywords && blog.keywords.length > 3 && (
                          <span className="text-xs text-gray-500">+{blog.keywords.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {blog.published ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={async () => {
                        if (!onEdit) return;
                        try {
                          const fullBlog = await fetchBlogById(blog._id);
                          onEdit(fullBlog);
                        } catch {
                          onEdit(blog);
                        }
                      }}
                      className="text-blue-500 hover:text-blue-700 mr-3"
                      title={`Edit ${blog.title || "blog"}`}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(blog._id)}
                      className="text-red-500 hover:text-red-700"
                      title={`Delete ${blog.title || "blog"}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  {searchTerm
                    ? `No blogs found matching "${searchTerm}"`
                    : "No Blogs found. Add your first blog!"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`flex items-center px-3 py-1 rounded-md ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              <ChevronLeft size={16} className="mr-1" /> Previous
            </button>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`flex items-center px-3 py-1 rounded-md ${
                currentPage === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              Next <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
      )}

      <Toaster position="top-right" />
    </div>
  );
}