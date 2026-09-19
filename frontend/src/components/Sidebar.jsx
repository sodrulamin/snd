import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Layers, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  LogOut, 
  CreditCard, 
  Tag, 
  Settings, 
  Palette, 
  ChevronDown, 
  ChevronUp,
  ChevronRight, 
  GripVertical, 
  X, 
  Megaphone,
  KeyRound,
  Pencil
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePageLoading } from '../context/PageLoadingContext';
import ChangePasswordModal from './ChangePasswordModal';
import UpdateProfileModal from './UpdateProfileModal';

const MIN_WIDTH = 80;
const COLLAPSE_THRESHOLD = 160;
const DEFAULT_EXPANDED_WIDTH = 256;
const MAX_WIDTH = 420;

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, isAdmin } = useAuth();
  const { isPageLoading } = usePageLoading();
  const navigate = useNavigate();
  const location = useLocation();

  // Load initial width and collapsed state
  const [width, setWidth] = useState(() => {
    try {
      const isCol = localStorage.getItem('sidebar_collapsed') === 'true';
      if (isCol) return MIN_WIDTH;
      const savedWidth = parseInt(localStorage.getItem('sidebar_width'), 10);
      if (savedWidth && savedWidth >= COLLAPSE_THRESHOLD && savedWidth <= MAX_WIDTH) {
        return savedWidth;
      }
      return DEFAULT_EXPANDED_WIDTH;
    } catch {
      return DEFAULT_EXPANDED_WIDTH;
    }
  });

  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(DEFAULT_EXPANDED_WIDTH);
  const hasMovedRef = useRef(false);

  const isCollapsed = width < COLLAPSE_THRESHOLD;

  const isSettingsActive = location.pathname.startsWith('/settings');
  const [isSettingsOpen, setIsSettingsOpen] = useState(isSettingsActive);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileContainerRef = useRef(null);

  const displayName = (user?.name && user.name.trim() !== '' && user.name !== 'System Administrator')
    ? user.name
    : (user?.fullName && user.fullName.trim() !== '' && user.fullName !== 'System Administrator')
      ? user.fullName
      : (user?.username || 'User');
  const userInitial = displayName.charAt(0).toUpperCase();

  // Close profile popup on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileContainerRef.current && !profileContainerRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCollapse = () => {
    if (isCollapsed) {
      // Expand to saved expanded width or default
      let savedExpanded = DEFAULT_EXPANDED_WIDTH;
      try {
        const saved = parseInt(localStorage.getItem('sidebar_expanded_width'), 10);
        if (saved && saved >= COLLAPSE_THRESHOLD && saved <= MAX_WIDTH) {
          savedExpanded = saved;
        }
      } catch (e) {}
      setWidth(savedExpanded);
      try {
        localStorage.setItem('sidebar_collapsed', 'false');
        localStorage.setItem('sidebar_width', String(savedExpanded));
      } catch (e) {}
    } else {
      // Collapse
      try {
        if (width >= COLLAPSE_THRESHOLD) {
          localStorage.setItem('sidebar_expanded_width', String(width));
        }
        localStorage.setItem('sidebar_collapsed', 'true');
        localStorage.setItem('sidebar_width', String(MIN_WIDTH));
      } catch (e) {}
      setWidth(MIN_WIDTH);
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = width;
    hasMovedRef.current = false;

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const handleMouseMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      const delta = moveEvent.clientX - dragStartXRef.current;
      if (Math.abs(delta) > 3) {
        hasMovedRef.current = true;
      }
      let newWidth = dragStartWidthRef.current + delta;
      if (newWidth < 120) {
        newWidth = MIN_WIDTH;
      } else if (newWidth > MAX_WIDTH) {
        newWidth = MAX_WIDTH;
      }
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      // If user merely clicked without dragging, toggle collapse
      if (!hasMovedRef.current) {
        toggleCollapse();
      } else {
        // Save final width
        setWidth((currentW) => {
          let finalW = currentW;
          if (finalW < COLLAPSE_THRESHOLD) {
            finalW = MIN_WIDTH;
            try {
              localStorage.setItem('sidebar_collapsed', 'true');
              localStorage.setItem('sidebar_width', String(MIN_WIDTH));
            } catch (e) {}
          } else {
            try {
              localStorage.setItem('sidebar_collapsed', 'false');
              localStorage.setItem('sidebar_width', String(finalW));
              localStorage.setItem('sidebar_expanded_width', String(finalW));
            } catch (e) {}
          }
          return finalW;
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleLogout = () => {
    if (onClose) onClose();
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Manage Inventory', path: '/inventory', icon: Layers },
    { name: 'Sales & Orders', path: '/sales', icon: ShoppingCart },
    { name: 'Campaigns & Expenses', path: '/campaigns', icon: Megaphone },
    { name: 'Distributors', path: '/distributors', icon: Users },
    { name: 'Reports & Revenue', path: '/reports', icon: BarChart3 },
    { name: 'Manage Card', path: '/cards', icon: Tag },
  ];

  const settingsSubItems = [
    { name: 'Theme Selection', path: '/settings/theme', icon: Palette },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fadeIn"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Aside (Sticky on desktop, Off-canvas drawer on mobile) */}
      <aside 
        style={{ '--sidebar-w': `${width}px` }}
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-40 h-screen bg-slate-900/95 lg:bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 flex flex-col select-none ${
          isDragging ? 'transition-none' : 'transition-all duration-300 ease-in-out'
        } ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        } w-64 lg:w-[var(--sidebar-w)]`}
      >
        {/* Draggable & Clickable Desktop Right Border Handle */}
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={toggleCollapse}
          className={`hidden lg:flex absolute -right-2.5 top-0 bottom-0 w-5 cursor-col-resize items-center justify-center group z-30 select-none ${
            isDragging ? 'bg-teal-500/10' : ''
          }`}
          title={isCollapsed ? 'Drag to resize or click to expand' : 'Drag to resize or click to minimize'}
        >
          {/* Border glowing line indicator */}
          <div className={`w-[3px] h-full transition-colors duration-200 ${
            isDragging ? 'bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]' : 'bg-transparent group-hover:bg-teal-500/60'
          }`} />
          
          {/* Subtle floating toggle pill handle in the middle */}
          <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-11 rounded-full bg-slate-800/95 border transition-all duration-200 flex items-center justify-center shadow-lg ${
            isDragging 
              ? 'border-teal-400 bg-slate-700 text-teal-300 opacity-100 scale-110' 
              : 'border-slate-700/80 group-hover:border-teal-400/60 group-hover:bg-slate-700 text-slate-400 group-hover:text-teal-300 opacity-0 group-hover:opacity-100 group-hover:scale-110'
          }`}>
            <GripVertical className="w-3 h-3 stroke-[2.5]" />
          </div>
        </div>

        {/* Brand Header */}
        <div className={`border-b border-slate-800/80 transition-all duration-200 p-4 ${
          isCollapsed ? 'lg:p-3 lg:flex lg:justify-center' : 'flex items-center justify-between'
        }`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:gap-0' : 'overflow-hidden'}`}>
            <div 
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20 flex-shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition"
              onClick={isCollapsed ? toggleCollapse : undefined}
              title={isCollapsed ? 'Click to expand sidebar' : 'IPTSP Recharge Distribution'}
            >
              <CreditCard className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            
            <div className={`overflow-hidden transition-all duration-200 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              <h1 className="font-bold text-lg leading-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent whitespace-nowrap">
                IPTSP S&D
              </h1>
              <p className="text-xs text-teal-400 font-medium whitespace-nowrap">Recharge Distribution</p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unified Nav Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={handleNavClick}
                title={isCollapsed ? item.name : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-xl font-medium text-sm border outline-none focus:outline-none focus:ring-0 select-none transition-colors duration-150 ${
                    isCollapsed 
                      ? 'px-3 py-2.5 lg:justify-center justify-between' 
                      : 'px-3.5 py-2.5 justify-between'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-500/20 to-teal-500/5 text-teal-300 border-teal-500/30 shadow-sm shadow-teal-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`flex items-center ${isCollapsed ? 'gap-3 lg:gap-0' : 'gap-3'}`}>
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className={`whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                        {item.name}
                      </span>
                    </div>
                    {isActive && (
                      <div className={`flex items-center ${isCollapsed ? 'lg:hidden' : ''}`}>
                        {isPageLoading ? (
                          <div className="flex items-center gap-1 px-1 py-0.5" title="Loading...">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 dot-pulse-1 shadow-sm shadow-teal-400/50"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 dot-pulse-2 shadow-sm shadow-teal-400/50"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 dot-pulse-3 shadow-sm shadow-teal-400/50"></span>
                          </div>
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-400/80 shadow-sm shadow-teal-400/50"></div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Settings Menu with Expandable Sub-Menu */}
          <div className="pt-1">
            <button
              onClick={() => {
                if (isCollapsed) {
                  toggleCollapse();
                  setIsSettingsOpen(true);
                } else {
                  setIsSettingsOpen(!isSettingsOpen);
                }
              }}
              title={isCollapsed ? 'Settings' : undefined}
              className={`w-full flex items-center rounded-xl font-medium text-sm border outline-none focus:outline-none select-none transition-colors duration-150 ${
                isCollapsed 
                  ? 'px-3 py-2.5 lg:justify-center justify-between' 
                  : 'px-3.5 py-2.5 justify-between'
              } ${
                isSettingsActive
                  ? 'bg-slate-800/60 text-teal-300 border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-transparent'
              }`}
            >
              <div className={`flex items-center ${isCollapsed ? 'gap-3 lg:gap-0' : 'gap-3'}`}>
                <Settings className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isSettingsOpen && !isCollapsed ? 'rotate-45 text-teal-400' : ''}`} />
                <span className={`whitespace-nowrap ${isCollapsed ? 'lg:hidden' : 'block'}`}>Settings</span>
              </div>
              <div className={`flex items-center ${isCollapsed ? 'lg:hidden' : ''}`}>
                {isSettingsOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-400 transition-transform duration-200" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400 transition-transform duration-200" />
                )}
              </div>
            </button>

            {/* Sub Menu Container */}
            {isSettingsOpen && (
              <div className={`mt-1 space-y-1 animate-fadeIn ${
                isCollapsed ? 'ml-4 pl-3 border-l-2 border-slate-800 lg:hidden' : 'ml-4 pl-3 border-l-2 border-slate-800'
              }`}>
                {settingsSubItems.map((subItem) => {
                  const SubIcon = subItem.icon;
                  return (
                    <NavLink
                      key={subItem.path}
                      to={subItem.path}
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs border outline-none select-none transition-colors duration-150 ${
                          isActive
                            ? 'bg-teal-500/15 text-teal-300 border-teal-500/30 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5">
                            <SubIcon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
                            <span>{subItem.name}</span>
                          </div>
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-sm shadow-teal-400/50"></div>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}

              </div>
            )}
          </div>
        </nav>

        {/* Profile & User Actions Footer */}
        <div ref={profileContainerRef} className="relative p-2.5 border-t border-slate-800/80 bg-slate-900/40">
          {isProfileMenuOpen && (
            <div 
              className={`absolute z-50 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-2 shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-150 ${
                isCollapsed 
                  ? 'bottom-full mb-2 left-2 right-2 lg:bottom-2 lg:left-full lg:ml-3 lg:w-64' 
                  : 'bottom-full mb-2 left-2 right-2'
              }`}
            >
              {/* User Info Header in Popup (Clickable to open Edit Profile Modal) */}
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  if (onClose) onClose();
                  setShowProfileModal(true);
                }}
                className="w-full text-left p-2.5 mb-1.5 border border-slate-800/80 hover:border-teal-500/40 bg-slate-800/40 hover:bg-slate-800/90 rounded-xl transition-all duration-150 group cursor-pointer block"
                title="Click to edit profile"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 group-hover:border-teal-500/40 group-hover:bg-teal-500/20 flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors">
                      {userInitial}
                    </div>
                    <div className="overflow-hidden min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white group-hover:text-teal-300 truncate transition-colors flex items-center gap-1.5">
                        <span className="truncate">{displayName}</span>
                        <Pencil className="w-3 h-3 text-slate-400 group-hover:text-teal-300 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
                      </div>
                      {user?.username && (
                        <div className="text-[11px] text-slate-400 truncate">
                          @{user.username}
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-300 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </div>
              </button>

              {/* Sub-menu Items */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    if (onClose) onClose();
                    setShowPasswordModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors duration-150 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  <span>Change Password</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-150 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}

          {/* Profile Card Button */}
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            title={`${displayName} (${user?.role || 'USER'})`}
            className={`w-full p-2 rounded-xl flex items-center transition-all duration-150 cursor-pointer text-left border ${
              isProfileMenuOpen 
                ? 'bg-slate-800/90 border-slate-700 shadow-md ring-1 ring-teal-500/30' 
                : 'bg-slate-800/40 hover:bg-slate-800/70 border-slate-800 hover:border-slate-700/60'
            } ${isCollapsed ? 'lg:justify-center lg:p-2' : 'gap-2.5'}`}
          >
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {userInitial}
            </div>

            <div className={`overflow-hidden flex-1 min-w-0 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-white truncate">
                  {displayName}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  isAdmin ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                  {user?.role || 'USER'}
                </span>
                {user?.balance !== undefined && !isAdmin && (
                  <span className="text-[11px] text-teal-400 font-medium truncate">
                    ৳{Number(user.balance).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div className={`text-slate-400 transition-transform duration-200 ${isCollapsed ? 'lg:hidden' : 'block'} ${
              isProfileMenuOpen ? 'rotate-180 text-teal-400' : ''
            }`}>
              <ChevronUp className="w-4 h-4 flex-shrink-0" />
            </div>
          </button>
        </div>
      </aside>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      <UpdateProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
}
