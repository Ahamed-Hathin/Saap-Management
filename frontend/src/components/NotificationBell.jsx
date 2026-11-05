import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  ShoppingBag, 
  CreditCard, 
  CheckCircle, 
  Users, 
  Info, 
  ArrowRight, 
  ClipboardList,
  Clock 
} from 'lucide-react';
import { NotificationContext } from '../context/NotificationContext';
import { AuthContext } from '../context/AuthContext';

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSec = Math.floor((now - date) / 1000);

  if (diffInSec < 60) return 'Just now';
  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `${diffInMin}m ago`;
  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

// Maps notification type and content to matching visual theme (icon, background, color)
const getNotificationVisual = (item) => {
  const title = (item.title || '').toLowerCase();
  const type = (item.type || '').toLowerCase();

  // Payment pending / Payment received
  if (type === 'payment' || title.includes('payment')) {
    return {
      icon: <CreditCard size={18} />,
      bg: '#fef3c7',
      color: '#f59e0b',
    };
  }
  // Order Ready to Dispatch / Delivered / Completed
  if (
    title.includes('ready') ||
    title.includes('dispatch') ||
    title.includes('delivered') ||
    title.includes('completed')
  ) {
    return {
      icon: <CheckCircle size={18} />,
      bg: '#dcfce7',
      color: '#16a34a',
    };
  }
  // Employee added / Staff / Attendance / Tasks
  if (type === 'employee' || title.includes('employee') || title.includes('staff')) {
    if (title.includes('lunch') || title.includes('break') || title.includes('check')) {
      return {
        icon: <Clock size={18} />,
        bg: title.includes('lunch') || title.includes('break') ? '#fef3c7' : '#dcfce7',
        color: title.includes('lunch') || title.includes('break') ? '#f59e0b' : '#16a34a',
      };
    }
    return {
      icon: <Users size={18} />,
      bg: '#dbeafe',
      color: '#2563eb',
    };
  }
  if (type === 'task' || title.includes('task')) {
    return {
      icon: <ClipboardList size={18} />,
      bg: '#dbeafe',
      color: '#2563eb',
    };
  }
  // Low stock / alerts / general
  if (type === 'stock' || title.includes('stock') || title.includes('alert') || type === 'general') {
    return {
      icon: <Info size={18} />,
      bg: '#ede9fe',
      color: '#6366f1',
    };
  }
  // Default Order received / created / assigned
  return {
    icon: <ShoppingBag size={18} />,
    bg: '#ede9fe',
    color: '#7c3aed',
  };
};

const NotificationBell = ({ align = 'end' }) => {
  const { user } = useContext(AuthContext);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useContext(NotificationContext);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!user) {
    return null;
  }

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif._id);
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    if (user.role === 'Admin') {
      navigate('/admin/orders');
    } else {
      navigate('/employee/orders');
    }
  };

  return (
    <div className="position-relative d-inline-block" ref={dropdownRef}>
      {/* Circular Bell Button matching the design image */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        className="btn d-flex align-items-center justify-content-center p-0 position-relative shadow-sm"
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          backgroundColor: isOpen ? '#e2e8f0' : '#f1f5f9',
          border: '1px solid #e2e8f0',
          transition: 'all 0.2s ease',
          outline: 'none',
        }}
      >
        <Bell size={20} className="text-dark" strokeWidth={2} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              minWidth: '19px',
              height: '19px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: '2px solid #ffffff',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              lineHeight: 1,
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover matching design image */}
      {isOpen && (
        <div
          className={`position-absolute bg-white shadow-lg ${align === 'end' ? 'end-0' : 'start-0'}`}
          style={{
            top: 'calc(100% + 14px)',
            width: '360px',
            maxWidth: '92vw',
            borderRadius: '20px',
            border: '1px solid rgba(226, 232, 240, 0.85)',
            boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.14), 0 8px 16px -6px rgba(0, 0, 0, 0.05)',
            padding: '18px 16px',
            zIndex: 1100,
          }}
        >
          {/* Top Pointer Arrow */}
          <div
            style={{
              position: 'absolute',
              top: '-7px',
              right: align === 'end' ? '15px' : 'auto',
              left: align === 'start' ? '15px' : 'auto',
              width: '14px',
              height: '14px',
              backgroundColor: '#ffffff',
              transform: 'rotate(45deg)',
              borderLeft: '1px solid rgba(226, 232, 240, 0.85)',
              borderTop: '1px solid rgba(226, 232, 240, 0.85)',
              zIndex: 1,
            }}
          />

          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-3 px-1">
            <div className="d-flex align-items-center gap-2">
              <Bell size={18} className="text-dark" strokeWidth={2.2} />
              <span className="fw-bold text-dark" style={{ fontSize: '1rem', letterSpacing: '-0.3px' }}>
                Notifications
              </span>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="btn btn-link p-0 text-decoration-none fw-semibold"
                style={{ color: '#4f46e5', fontSize: '0.82rem' }}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div 
            className="d-flex flex-column gap-1"
            style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '2px' }}
          >
            {notifications.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <Bell size={32} className="text-secondary opacity-50 mb-2" />
                <p className="mb-0 fw-medium small text-dark">No notifications yet</p>
                <p className="mb-0 text-secondary" style={{ fontSize: '0.75rem' }}>
                  When orders, tasks, or updates occur, they will appear here.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const visual = getNotificationVisual(item);
                return (
                  <div
                    key={item._id}
                    onClick={() => handleNotificationClick(item)}
                    className="d-flex align-items-center justify-content-between p-2 rounded-3 text-decoration-none"
                    style={{
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                      backgroundColor: !item.isRead ? 'rgba(238, 242, 255, 0.5)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = !item.isRead ? 'rgba(238, 242, 255, 0.5)' : 'transparent';
                    }}
                  >
                    {/* Left: Icon and Text */}
                    <div className="d-flex align-items-center gap-3 overflow-hidden me-2" style={{ minWidth: 0 }}>
                      <div
                        className="d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '12px',
                          backgroundColor: visual.bg,
                          color: visual.color,
                        }}
                      >
                        {visual.icon}
                      </div>
                      <div className="overflow-hidden" style={{ minWidth: 0 }}>
                        <div
                          className="fw-bold text-dark text-truncate"
                          style={{ fontSize: '0.88rem', lineHeight: 1.25 }}
                        >
                          {item.title}
                        </div>
                        <div
                          className="text-muted text-truncate mt-1"
                          style={{ fontSize: '0.78rem', lineHeight: 1.2 }}
                        >
                          {item.message}
                        </div>
                      </div>
                    </div>

                    {/* Right: Timestamp and Unread Blue Dot */}
                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      <span className="text-muted" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {formatTimeAgo(item.createdAt)}
                      </span>
                      {!item.isRead ? (
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#4f46e5',
                            display: 'inline-block',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <span style={{ width: '8px', height: '8px', display: 'inline-block', flexShrink: 0 }} />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer: View All Notifications */}
          <div className="text-center pt-3 mt-2 border-top">
            <button
              type="button"
              onClick={handleViewAll}
              className="btn btn-link p-0 text-decoration-none fw-bold d-inline-flex align-items-center gap-2"
              style={{ color: '#4f46e5', fontSize: '0.85rem' }}
            >
              View All Notifications <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
