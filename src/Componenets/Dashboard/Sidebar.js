import { Menu, X } from "lucide-react";
import {
  FaRegNewspaper,
  FaPenFancy,
  FaFileSignature,
  FaUsers,
  FaUserPlus,
  FaMapMarkedAlt,
  FaListAlt,
  FaBuilding,
} from "react-icons/fa";

export default function Sidebar({
  activeTab,
  setActiveTab,
  sidebarOpen,
  toggleSidebar,
}) {
  return (
    <div
      className={`${
        sidebarOpen ? "w-64" : "w-20"
      } transition-all duration-300 bg-white text-white  shadow-xl rounded-r-lg flex flex-col min-h-screen overflow-y-auto`}
    >
      {/* Header */}
      <div className="flex justify-between p-4 pl-10">
        <button onClick={toggleSidebar} className="text-black cursor-pointer">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col mt-6 space-y-2 px-2">
        
        <SidebarButton
          icon={<FaRegNewspaper size={20} />}
          label="All Blogs"
          isActive={activeTab === "blog"}
          onClick={() => setActiveTab("blog")}
          sidebarOpen={sidebarOpen}
        />

        <SidebarButton
          icon={<FaPenFancy size={20} />}
          label="Add Blogs"
          isActive={activeTab === "Addblog"}
          onClick={() => setActiveTab("Addblog")}
          sidebarOpen={sidebarOpen}
        />

        <SidebarButton
          icon={<FaFileSignature size={20} />}
          label="Data Request"
          isActive={activeTab === "DataRequest"}
          onClick={() => setActiveTab("DataRequest")}
          sidebarOpen={sidebarOpen}
        />

        <SidebarButton
          icon={<FaUserPlus size={20} />}
          label="Add User"
          isActive={activeTab === "AddUser"}
          onClick={() => setActiveTab("AddUser")}
          sidebarOpen={sidebarOpen}
        />

        <SidebarButton
          icon={<FaUsers size={20} />}
          label="All Users"
          isActive={activeTab === "Users"}
          onClick={() => setActiveTab("Users")}
          sidebarOpen={sidebarOpen}
        />



   
        <SidebarButton
          icon={<FaMapMarkedAlt size={20} />}
          label="City hub (MSP)"
          isActive={activeTab === "CityHub"}
          onClick={() => setActiveTab("CityHub")}
          sidebarOpen={sidebarOpen}
        />

        <SidebarButton
          icon={<FaBuilding size={20} />}
          label="Managed IT Services"
          isActive={activeTab === "ManagedIT"}
          onClick={() => setActiveTab("ManagedIT")}
          sidebarOpen={sidebarOpen}
        />

        <SidebarButton
          icon={<FaListAlt size={20} />}
          label="Listing Requests"
          isActive={activeTab === "ListingRequests"}
          onClick={() => setActiveTab("ListingRequests")}
          sidebarOpen={sidebarOpen}
        />

       
      </div>
    </div>
  );
}

// Reusable Button Component
function SidebarButton({ icon, label, isActive, onClick, sidebarOpen }) {
  return (
    <button
      className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
        isActive
          ? "bg-[#1d4882] text-white font-semibold"
          : "hover:bg-[#798fab] text-black"
      }`}
      onClick={onClick}
    >
      {icon}
      {sidebarOpen && <span className="ml-3">{label}</span>}
    </button>
  );
}
