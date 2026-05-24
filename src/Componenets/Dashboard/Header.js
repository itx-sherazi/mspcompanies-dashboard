import { Bell } from "lucide-react";

export default function Header({ sidebarOpen, toggleSidebar }) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-end px-6 py-4">
        <div className="flex items-center space-x-4">
          {/* Notification Icon */}
          <button className="relative p-1">
            <Bell size={24} className="text-gray-700" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-[#1e477f] rounded-full"></span>
          </button>

          {/* Profile Section */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold">
              AD
            </div>
            <div className="hidden md:block">
              s<p className="text-sm font-medium">Admin</p>
              <p className="text-xs text-gray-500">info@mspcompanies.us </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
