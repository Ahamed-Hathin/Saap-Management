import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, Form, Button, Badge, Spinner } from 'react-bootstrap';
import { 
  Bell, 
  ShoppingBag, 
  CreditCard, 
  CheckCircle, 
  Users, 
  Info, 
  Clock, 
  CheckCheck, 
  Trash2, 
  ExternalLink,
  Calendar,
  Filter
} from 'lucide-react';
import api from '../services/api';
import { NotificationContext } from '../context/NotificationContext';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';

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

const formatExactDateTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const dateFormatted = d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeFormatted = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateFormatted} at ${timeFormatted}`;
};

const getNotificationVisual = (item) => {
  const title = (item.title || '').toLowerCase();
  const type = (item.type || '').toLowerCase();

  if (type === 'payment' || title.includes('payment')) {
    return {
      icon: <CreditCard size={20} />,
      bg: '#fef3c7',
      color: '#f59e0b',
      badge: 'Payment',
    };
  }
  if (
    title.includes('ready') ||
    title.includes('dispatch') ||
    title.includes('delivered') ||
    title.includes('completed')
  ) {
    return {
      icon: <CheckCircle size={20} />,
      bg: '#dcfce7',
      color: '#16a34a',
      badge: 'Order Status',
    };
  }
  if (type === 'employee' || title.includes('employee') || title.includes('staff')) {
    if (title.includes('lunch') || title.includes('break') || title.includes('check')) {
      return {
        icon: <Clock size={20} />,
        bg: title.includes('lunch') || title.includes('break') ? '#fef3c7' : '#dcfce7',
        color: title.includes('lunch') || title.includes('break') ? '#f59e0b' : '#16a34a',
        badge: 'Attendance',
      };
    }
    return {
      icon: <Users size={20} />,
      bg: '#dbeafe',
      color: '#2563eb',
      badge: 'Staff',
    };
  }
  if (type === 'task' || title.includes('task')) {
    return {
      icon: <CheckCircle size={20} />,
      bg: '#dbeafe',
      color: '#2563eb',
      badge: 'Task',
    };
  }
  if (type === 'stock' || title.includes('stock') || title.includes('alert')) {
    return {
      icon: <Info size={20} />,
      bg: '#ede9fe',
      color: '#6366f1',
      badge: 'Alert',
    };
  }
  return {
    icon: <ShoppingBag size={20} />,
    bg: '#ede9fe',
    color: '#7c3aed',
    badge: 'Order',
  };
};

const Notifications = () => {
  const { user } = useContext(AuthContext);
  const { fetchNotifications: refreshGlobalNotifications } = useContext(NotificationContext);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const fetchPageNotifications = async () => {
    setLoading(true);
    try {
      let url = `/notifications?`;
      if (filter && filter !== 'all') {
        url += `filter=${filter}&`;
      }
      if (filter === 'custom' && customStartDate && customEndDate) {
        url += `startDate=${customStartDate}&endDate=${customEndDate}&`;
      }
      const res = await api.get(url);
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filter === 'custom' && (!customStartDate || !customEndDate)) {
      return;
    }
    fetchPageNotifications();
  }, [filter, customStartDate, customEndDate]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      refreshGlobalNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      refreshGlobalNotifications();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'All notifications marked as read',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      refreshGlobalNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = async (item) => {
    if (!item.isRead) {
      await handleMarkAsRead(item._id);
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <Layout>
      {/* Header Bar */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h2 className="mb-0 fw-bold text-dark tracking-tight">Notifications</h2>
            {unreadCount > 0 && (
              <Badge bg="danger" pill style={{ fontSize: '0.8rem', padding: '0.35em 0.7em' }}>
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <p className="text-muted mt-1 mb-0" style={{ fontSize: '0.9rem' }}>
            Latest notifications are listed first at the top
          </p>
        </div>

        {/* Filter Controls & Actions */}
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <div className="d-flex flex-wrap gap-2 align-items-center bg-white rounded-3 shadow-sm border px-3 py-1">
            <Filter size={16} className="text-muted" />
            <Form.Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border-0 shadow-none bg-transparent fw-medium text-dark"
              style={{ width: 'auto', minWidth: '150px', cursor: 'pointer', height: '38px', fontSize: '0.9rem' }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="custom">Custom Date Range</option>
            </Form.Select>

            {filter === 'custom' && (
              <div className="d-flex gap-2 border-start ps-3 ms-1 align-items-center flex-wrap">
                <Form.Control
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="border-0 bg-transparent shadow-none text-secondary"
                  style={{ width: '135px', fontSize: '0.85rem' }}
                />
                <span className="text-muted small">to</span>
                <Form.Control
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="border-0 bg-transparent shadow-none text-secondary"
                  style={{ width: '135px', fontSize: '0.85rem' }}
                />
              </div>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline-primary"
              onClick={handleMarkAllRead}
              className="d-flex align-items-center gap-2 rounded-3 shadow-sm"
              style={{ height: '44px', fontWeight: 600, fontSize: '0.85rem' }}
            >
              <CheckCheck size={18} /> Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List Container */}
      <Card className="dashboard-card border-0 rounded-4 shadow-sm overflow-hidden">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <div className="mt-2 text-muted small">Loading notifications...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-5 px-3 text-muted">
              <div
                className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center p-3 mb-3 text-secondary"
                style={{ width: '64px', height: '64px' }}
              >
                <Bell size={32} className="opacity-50" />
              </div>
              <h5 className="fw-semibold text-dark mb-1">No notifications found</h5>
              <p className="text-muted small mb-0">
                {filter !== 'all'
                  ? 'No notifications match the selected time filter.'
                  : 'You have no notifications at this time.'}
              </p>
            </div>
          ) : (
            <div className="d-flex flex-column divide-y">
              {notifications.map((item) => {
                const visual = getNotificationVisual(item);
                return (
                  <div
                    key={item._id}
                    onClick={() => handleNotificationClick(item)}
                    className="p-3 p-md-4 border-bottom d-flex align-items-start justify-content-between gap-3 text-decoration-none"
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      backgroundColor: !item.isRead ? 'rgba(238, 242, 255, 0.45)' : '#ffffff',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = !item.isRead
                        ? 'rgba(238, 242, 255, 0.45)'
                        : '#ffffff';
                    }}
                  >
                    {/* Left: Category Icon + Content */}
                    <div className="d-flex align-items-start gap-3 flex-grow-1" style={{ minWidth: 0 }}>
                      {/* Icon */}
                      <div
                        className="d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '14px',
                          backgroundColor: visual.bg,
                          color: visual.color,
                        }}
                      >
                        {visual.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`text-dark ${!item.isRead ? 'fw-bold' : 'fw-semibold'}`}
                            style={{ fontSize: '0.98rem' }}
                          >
                            {item.title}
                          </span>
                          {!item.isRead && (
                            <Badge
                              bg="primary"
                              pill
                              style={{ fontSize: '0.65rem', padding: '0.25em 0.55em' }}
                            >
                              New
                            </Badge>
                          )}
                          <span
                            className="badge text-secondary border bg-light"
                            style={{ fontSize: '0.7rem', fontWeight: 500 }}
                          >
                            {visual.badge}
                          </span>
                        </div>

                        {/* Description Message */}
                        <p
                          className="text-secondary mb-2"
                          style={{ fontSize: '0.88rem', lineHeight: 1.4 }}
                        >
                          {item.message}
                        </p>

                        {/* Exact Time & Relative Time */}
                        <div className="d-flex align-items-center gap-3 text-muted small flex-wrap">
                          <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                            <Clock size={13} className="text-secondary" />
                            {formatExactDateTime(item.createdAt)}
                          </span>
                          <span className="text-primary fw-medium" style={{ fontSize: '0.8rem' }}>
                            ({formatTimeAgo(item.createdAt)})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Unread Dot & Actions */}
                    <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-2">
                      {!item.isRead && (
                        <span
                          title="Unread"
                          style={{
                            width: '9px',
                            height: '9px',
                            borderRadius: '50%',
                            backgroundColor: '#4f46e5',
                            display: 'inline-block',
                          }}
                        />
                      )}

                      {item.link && (
                        <Button
                          variant="light"
                          size="sm"
                          className="text-primary border p-1 rounded-2"
                          title="Open Link"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNotificationClick(item);
                          }}
                        >
                          <ExternalLink size={16} />
                        </Button>
                      )}

                      {!item.isRead && (
                        <Button
                          variant="light"
                          size="sm"
                          className="text-success border p-1 rounded-2"
                          title="Mark as read"
                          onClick={(e) => handleMarkAsRead(item._id, e)}
                        >
                          <CheckCheck size={16} />
                        </Button>
                      )}

                      <Button
                        variant="light"
                        size="sm"
                        className="text-danger border p-1 rounded-2"
                        title="Delete notification"
                        onClick={(e) => handleDeleteNotification(item._id, e)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card.Body>
      </Card>
    </Layout>
  );
};

export default Notifications;

