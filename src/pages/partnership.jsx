import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  Edit,
  Trash2,
  ArrowUpDown,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

// Components
import NavBar from "../components/NavBar";
import FilterButton from "../features/partnership/components/FilterButton";
import FilterDropdown from "../features/partnership/components/FilterDropdown";
import TableHeader from "../features/partnership/components/TableHeader";
import PartnerRow from "../features/partnership/components/PartnerRow";
import Pagination from "../features/partnership/components/Pagination";
import Toast from "../features/partnership/components/Toast";
import ConfirmDialog from "../features/partnership/components/ConfirmDialog";
import FilterDialog from "../features/partnership/components/FilterDialog";
import LoadingSpinner from "../components/LoadingSpinner";

// Data and utilities
import {
  partnerTypes,
  partnerStatuses,
  durationCategories,
  tableColumns,
} from "../features/partnership/data/sampleData";
import {
  filterBySearch,
  applyFilters,
  sortPartners,
  // paginatePartners, // REMOVE client-side pagination
} from "../features/partnership/utils/partnershipUtils";
import useLocalStorage from "../features/partnership/hooks/useLocalStorage";
import { getPartnerships, deletePartnership } from "../api.jsx";

const PartnershipDashboard = () => {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [partners, setPartners] = useState([]);
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

  // Filter states
  const [activeFilterButton, setActiveFilterButton] = useLocalStorage(
    "activeFilterButton",
    "name"
  );
  const [filters, setFilters] = useLocalStorage("partnershipFilters", {
    types: [],
    statuses: [],
    durations: [],
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useLocalStorage("partnershipSort", {
    column: "name",
    direction: "asc",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useLocalStorage("currentPage", 1);
  const [itemsPerPage, setItemsPerPage] = useLocalStorage("itemsPerPage", 10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // UI states
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Fetch partners from backend with pagination
  useEffect(() => {
    async function fetchPartners() {
      setLoading(true);
      try {
        const response = await getPartnerships({
          page: currentPage,
          limit: itemsPerPage,
          sortBy: sortConfig.column,
          sortDirection: sortConfig.direction,
          types: filters.types,
          statuses: filters.statuses,
          durations: filters.durations,
        });
        const { partnerships = [], pagination = {} } = response.data;
        // Map backend data to frontend table structure
        const mappedPartners = partnerships.map((p) => ({
          id: p._id || p.id,
          logo: p.logo || "/placeholder.svg",
          name: p.partnerInstitution?.name || "-",
          type: p.partnerInstitution?.typeOfOrganization || "-",
          duration: p.durationOfPartnership || "-",
          contact: p.partnerContactPerson?.name || "-",
          status: p.status || "-",
          createdAt: p.createdAt || "-",
          country: p.partnerInstitution?.country || "-",
          deliverables: p.deliverables || [],
          fundingAmount: p.fundingAmount,
          description: p.description || "-",
        }));
        setPartners(mappedPartners);
        setTotalItems(pagination.total || 0);
        setTotalPages(pagination.pages || 1);
      } catch (error) {
        setPartners([]);
        setFilteredPartners([]);
        setTotalItems(0);
        setTotalPages(1);
        setToast({ message: "Failed to fetch partnerships", type: "error" });
      } finally {
        setLoading(false);
      }
    }
    fetchPartners();
  }, [currentPage, itemsPerPage, sortConfig, filters]);

  // Apply search client-side only
  useEffect(() => {
    let result = [...partners];
    result = filterBySearch(result, searchQuery);
    setFilteredPartners(result);
  }, [searchQuery, partners]);

  // Handle sorting
  const handleSort = (column, direction) => {
    if (column === "actions") return;
    setSortConfig({ column, direction });
  };

  // Handle partner delete
  const handleDeletePartner = (partnerId) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Partner",
      message:
        "Are you sure you want to delete this partner? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await deletePartnership(partnerId);
          setPartners((prev) =>
            prev.filter((partner) => partner.id !== partnerId)
          );
          showToast("Partner deleted successfully", "success");
        } catch (error) {
          showToast(
            error.response?.data?.message || "Failed to delete partner",
            "error"
          );
        } finally {
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  // Handle partner edit
  const handleEditPartner = (partnerId) => {
    showToast(`Editing partner ${partnerId}`, "info");
  };

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setFilters({
      types: [],
      statuses: [],
      durations: [],
    });
    setSortConfig({
      column: "name",
      direction: "asc",
    });
    setActiveFilterButton("name");
    showToast("All filters cleared", "info");
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    filters.types.length > 0 ||
    filters.statuses.length > 0 ||
    filters.durations.length > 0;

  const modifiedColumns = tableColumns.filter((col) => col.key !== "selectAll");

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      {/* Main Content */}
      <main className="flex-1 bg-gray-50 py-8 px-4 md:px-8">
        <div className="container mx-auto">
          {/* Active Partnership Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold">Active Partnership</h2>
              <p className="text-[#004165] text-sm mt-0.5">
                Explore details about active agreements, project focus areas,
                and partner organizations.
              </p>
            </div>
            <Link
              to="/add-partnership"
              className="bg-[#004165] hover:bg-[#00334e] text-white rounded-full px-10 py-2 flex items-center transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="text-base font-medium">New Partnership</span>
            </Link>
          </div>
          {/* Search and Filter */}
          <div className="bg-[#DBE4E9] rounded-lg md:rounded-full p-4 md:p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search Partners"
                  className="w-full pl-10 pr-10 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#004165] hover:border-[#00334e] bg-white transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setIsFilterDialogOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  hasActiveFilters
                    ? "bg-[#004165] text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Filter className="h-4 w-4" />
                {hasActiveFilters && (
                  <span className="flex items-center justify-center bg-white text-[#004165] rounded-full w-5 h-5 text-xs">
                    {filters.types.length +
                      filters.statuses.length +
                      filters.durations.length}
                  </span>
                )}
              </button>
              {/* Filter Buttons Section */}
              <div className="bg-[#6D91A7] rounded-full flex items-center px-2">
                <FilterButton
                  label="Name"
                  isActive={activeFilterButton === "name"}
                  onClick={() => {
                    setActiveFilterButton("name");
                    setSortConfig({ column: "name", direction: "asc" });
                  }}
                />
                <FilterButton
                  label="Type"
                  isActive={activeFilterButton === "type"}
                  onClick={() => {
                    setActiveFilterButton("type");
                    setSortConfig({ column: "type", direction: "asc" });
                  }}
                />
                <FilterButton
                  label="Status"
                  isActive={activeFilterButton === "status"}
                  onClick={() => {
                    setActiveFilterButton("status");
                    setSortConfig({ column: "status", direction: "asc" });
                  }}
                />
                <FilterButton
                  label="Duration"
                  isActive={activeFilterButton === "duration"}
                  onClick={() => {
                    setActiveFilterButton("duration");
                    setSortConfig({ column: "duration", direction: "asc" });
                  }}
                />
              </div>
            </div>
          </div>
          {/* Partnership Lists */}
          <div className="bg-[#DBE4E9] rounded-3xl mb-6">
            <div className="flex justify-between items-center px-6 py-4">
              <h3 className="text-lg font-bold">Partnership Lists</h3>
              <div className="text-sm text-gray-600">
                Showing{" "}
                {Math.min(totalItems, 1 + (currentPage - 1) * itemsPerPage)}-
                {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                {totalItems} partners
              </div>
              <button
                onClick={() => {
                  setSortConfig((prev) => ({
                    column: "createdAt",
                    direction: prev.column === "createdAt" && prev.direction === "asc" ? "desc" : "asc",
                  }));
                  setActiveFilterButton(null);
                }}
                className="text-[#004165] hover:bg-[#004165]/10 p-2 rounded-full transition-colors"
                title="Sort by Created At"
              >
                <ArrowUpDown className="h-5 w-5" />
                {sortConfig.column === "createdAt" && (
                  sortConfig.direction === "asc"
                    ? <ChevronUp className="h-4 w-4 ml-1" />
                    : <ChevronDown className="h-4 w-4 ml-1" />
                )}
              </button>
            </div>
            <div className="bg-white rounded-b-3xl overflow-hidden">
              {/* Table Container with Horizontal Scroll */}
              <div className="overflow-x-auto">
                <div className="min-w-[600px] sm:min-w-[800px]">
                  {/* Table Header */}
                  <TableHeader
                    columns={modifiedColumns}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  {/* No Results */}
                  {filteredPartners.length === 0 && (
                    <div className="p-4 sm:p-8 text-center text-gray-500">
                      <p>No partners found matching your criteria.</p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearAllFilters}
                          className="mt-2 text-[#004165] hover:underline"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  )}
                  {/* Table Rows */}
                  {filteredPartners.map((partner) => (
                    <PartnerRow
                      key={partner.id}
                      partner={partner}
                      onDelete={handleDeletePartner}
                      onEdit={handleEditPartner}
                    />
                  ))}
                </div>
              </div>
              {/* Pagination */}
              <div className="px-2 sm:px-4">
                <Pagination
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Filter Dialog */}
      <FilterDialog
        isOpen={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={clearAllFilters}
        hasActiveFilters={hasActiveFilters}
      />
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default PartnershipDashboard;
