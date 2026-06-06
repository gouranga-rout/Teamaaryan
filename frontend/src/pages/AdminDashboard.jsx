import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { io } from 'socket.io-client';
import API from '../api';
import { MdOutlineAnalytics } from "react-icons/md";
import { QRCodeSVG } from 'qrcode.react';
import '../App.css';
import { FaCalendarDay } from "react-icons/fa";
import { FcCalendar,FcPlanner,FcStatistics } from "react-icons/fc";

// ── Swipeable Notification Card ──
const SwipeableNotif = ({ n, onDelete }) => {
  const [startX, setStartX] = useState(null);
  const [offsetX, setOffsetX] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const onTouchStart = (e) => setStartX(e.touches[0].clientX);
  const onTouchMove = (e) => {
    if (startX === null) return;
    const diff = e.touches[0].clientX - startX;
    if (diff > 0) setOffsetX(Math.min(diff, 120));
  };
  const onTouchEnd = () => {
    if (offsetX > 80) {
      setDeleting(true);
      setTimeout(() => onDelete(n._id), 300);
    } else {
      setOffsetX(0);
    }
    setStartX(null);
  };

  const icons = { new_register:'🆕', account_approved:'✅', account_suspended:'🚫', new_message:'📩', live_milestone:'👁️', team_milestone:'🚀', team_joined:'👥', team_update:'⚠️' };

  return (
    <div
      className={`notif-card ${n.is_read ? 'notif-read' : 'notif-unread'} ${deleting ? 'notif-deleting' : ''}`}
      style={{ transform: `translateX(${offsetX}px)`, transition: offsetX === 0 ? 'transform .3s' : 'none', position:'relative' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {offsetX > 40 && (
        <div className="notif-swipe-hint">🗑️</div>
      )}
      <div className="notif-card-icon">{icons[n.type] || '🔔'}</div>
      <div className="notif-card-content">
        <div className="notif-title">{n.title}</div>
        <div className="notif-body">{n.body}</div>
        <div className="notif-time">{new Date(n.created_at).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</div>
      </div>
    </div>
  );
};

// ── Notification Drawer ──
const NotificationDrawer = ({ notifications, setNotifications, unreadCount, setUnreadCount, onClose }) => {
  const deleteOne = async (id) => {
    try {
      await API.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch {}
  };

  const clearAll = async () => {
    try {
      await API.delete('/api/notifications/all');
      setNotifications([]);
      setUnreadCount(0);
    } catch {}
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="profile-drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>🔔 Notifications</h3>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>
        {notifications.length > 0 && (
          <div style={{padding:'.5rem 1.2rem 0', textAlign:'right'}}>
            <button className="notif-clear-btn" onClick={clearAll}>🗑️ Clear All</button>
	     <p className="notif-swipe-tip">Swipe right to delete</p>
          </div>
        )}
        <div className="drawer-body">
          {notifications.length === 0
            ? <div className="admin-empty" style={{marginTop:'2rem'}}>No notifications yet</div>
            : notifications.map(n => (
                <SwipeableNotif key={n._id} n={n} onDelete={deleteOne} />
              ))
          }
        </div>
      </div>
    </div>
  );
};

const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const daysSince = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const MessagesTab = () => {
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [replyOpen, setReplyOpen] = useState({});

  useEffect(() => {
    API.get('/api/admin/messages').then(r => setMessages(r.data)).catch(() => {});
  }, []);

  const markRead = async (id) => {
    await API.put(`/api/admin/messages/${id}/read`);
    setMessages(prev => prev.map(m => m._id === id ? {...m, is_read: true} : m));
  };

  const sendReply = async (id) => {
    if (!replyText[id]) return;
    try {
      await API.post(`/api/admin/messages/${id}/reply`, { replyText: replyText[id] });
      setMessages(prev => prev.map(m => m._id === id ? {...m, reply: replyText[id], replied_at: new Date()} : m));
      setReplyOpen(prev => ({...prev, [id]: false}));
    } catch {}
  };

  const deleteMsg = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    await API.delete(`/api/admin/messages/${id}`);
    setMessages(prev => prev.filter(m => m._id !== id));
  };

  if (messages.length === 0) return <div className="admin-empty">No messages yet 📭</div>;

  return (
    <>
      {messages.map(m => (
        <div key={m._id} className={`msg-card ${!m.is_read ? 'unread' : ''}`}>
          <div className="msg-card-header">
            <div>
              <div className="msg-card-name">
                {m.name} &nbsp;
                {!m.is_read && <span className="unread-badge">NEW</span>}
              </div>
              <div className="msg-card-meta">📧 {m.email} &nbsp;|&nbsp; 📞 {m.phone}</div>
              <div className="msg-card-meta">📅 {new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString()}</div>
            </div>
          </div>
          <div className="msg-subject">📌 {m.subject}</div>
          <div className="msg-body">{m.message}</div>

          {m.reply && (
            <div className="msg-replied">
              <div className="msg-replied-label">✅ Replied on {new Date(m.replied_at).toLocaleDateString()}</div>
              <div className="msg-replied-text">{m.reply}</div>
            </div>
          )}

          {replyOpen[m._id] && (
            <div className="msg-reply-box">
              <textarea className="msg-reply-input" rows={3}
                placeholder="Type your reply..."
                value={replyText[m._id] || ''}
                onChange={e => setReplyText(prev => ({...prev, [m._id]: e.target.value}))}
              />
              <div className="msg-actions">
                <button className="btn-reply" onClick={() => sendReply(m._id)}>📤 Send Reply</button>
                <button className="btn-reject" onClick={() => setReplyOpen(prev => ({...prev, [m._id]: false}))}>Cancel</button>
              </div>
            </div>
          )}

          <div className="msg-actions">
            {!m.is_read && <button className="btn-view" onClick={() => markRead(m._id)}>👁️ Mark Read</button>}
            {!replyOpen[m._id] && <button className="btn-reply" onClick={() => { setReplyOpen(prev => ({...prev, [m._id]: true})); markRead(m._id); }}>💬 Reply</button>}
            <button className="btn-delete" onClick={() => deleteMsg(m._id)}>🗑️ Delete</button>
          </div>
        </div>
      ))}
    </>
  );
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [media, setMedia] = useState({ banner: null, proofs: [] });
  const referralPageUrl = `${window.location.origin}/${user?.username}`;
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState('');
  const [adminStats, setAdminStats] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [searchBy, setSearchBy] = useState('username');
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [trip, setTrip] = useState({ destination:'', nights:'', days:'', qualification_amount:'', start_date:'', end_date:'' });
  const [tripMsg, setTripMsg] = useState('');
  const [tripLoading, setTripLoading] = useState(false);
  const [refreshTimer, setRefreshTimer] = useState(0);
  const [teamModal, setTeamModal] = useState({ open: false, user: null, members: [] });
  const [memberDetail, setMemberDetail] = useState(null);
  const [viewProfile, setViewProfile] = useState(null);
  const [viewProfileLoading, setViewProfileLoading] = useState(false);
  const [currentTeamUsername, setCurrentTeamUsername] = useState(null);
  const [liveCount, setLiveCount] = useState(0);
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [festivalOffer, setFestivalOffer] = useState({
    active: false, marqueeText: '', startDate: '', endDate: '',
    bannerUrl: '', packages: [
      { slug:'starter-package', name:'Starter Package', amount:260, direct:200, passive:20 },
      { slug:'intermediate', name:'Intermediate Package', amount:512, direct:400, passive:40 },
      { slug:'expert', name:'Expert Package', amount:1050, direct:800, passive:80 },
      { slug:'master', name:'Master Package', amount:2299, direct:1700, passive:170 },
      { slug:'brahmastra', name:'Brahmastra Package', amount:4999, direct:3800, passive:380 },
      { slug:'premium-pro', name:'Premium Pro Package', amount:9998, direct:7300, passive:730 },
    ]
  });
  const festivalBannerRef = useRef();
  const [pkgMonth, setPkgMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [pkgClicks, setPkgClicks] = useState({});
  const [myTeam, setMyTeam] = useState([]);
  const [myTeamLoaded, setMyTeamLoaded] = useState(false);
  const [myTeamSearchBy, setMyTeamSearchBy] = useState('username');
  const [myTeamSearchQuery, setMyTeamSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const bannerRef = useRef();
  const proofRef = useRef();
  const photoRef = useRef();

  const fetchRequests = async () => { try { const r = await API.get('/api/admin/requests'); setRequests(r.data); } catch {} };
  const fetchUsers = async () => { try { const r = await API.get('/api/admin/users'); setUsers(r.data); } catch {} };
  const fetchMedia = async () => { try { const r = await API.get('/api/admin/media'); setMedia(r.data); } catch {} };
  const fetchCurrentPhoto = async () => { try { const r = await API.get('/api/profile/photo'); setPhotoUrl(r.data.url); } catch {} };
  const fetchProfile = async () => { try { const r = await API.get('/api/dashboard/profile'); setProfile(r.data); } catch {} };
  const fetchNotifications = async () => {
    try {
      const r = await API.get('/api/notifications');
      setNotifications(r.data);
      setUnreadCount(r.data.filter(n => !n.is_read).length);
    } catch {}
  };
  const markAllRead = async () => {
    try {
      await API.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };
  const fetchAdminStats = async () => {
  try {
    const r = await API.get('/api/dashboard/stats');
    setAdminStats(r.data);
    setRefreshTimer(10);
    const interval = setInterval(() => {
      setRefreshTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  } catch {}
};

  const fetchAnnouncement = async () => {
    try {
      const r = await API.get('/api/admin/announcement');
      setAnnouncementActive(r.data.announcementActive);
    } catch {}
  };

  const fetchFestivalOffer = async () => {
    try {
      const r = await API.get('/api/admin/festival-offer');
      setFestivalOffer(prev => ({
        ...prev,
        ...r.data,
        startDate: r.data.startDate ? r.data.startDate.split('T')[0] : '',
        endDate: r.data.endDate ? r.data.endDate.split('T')[0] : '',
      }));
    } catch {}
  };

  const saveFestivalOffer = async () => {
    try {
      await API.put('/api/admin/festival-offer', festivalOffer);
      setMsg('✅ Festival offer saved!');
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('❌ Error saving festival offer'); }
  };

  const uploadFestivalBanner = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('image', file);
    try {
      const r = await API.post('/api/admin/festival-offer/banner', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFestivalOffer(prev => ({ ...prev, bannerUrl: r.data.url }));
      setMsg('✅ Festival banner uploaded!');
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('❌ Banner upload failed'); }
  };

  const updateFestivalPkg = (slug, field, value) => {
    setFestivalOffer(prev => ({
      ...prev,
      packages: prev.packages.map(p => p.slug === slug ? { ...p, [field]: Number(value) } : p)
    }));
  };

  const toggleAnnouncement = async () => {
    try {
      const newVal = !announcementActive;
      setAnnouncementActive(newVal);
      await API.put('/api/admin/announcement', { announcementActive: newVal });
    } catch {}
  };

  const fetchTrip = async () => {
    try {
      const r = await API.get('/api/admin/trip');
      if (r.data && r.data.destination) {
        setTrip({
          destination: r.data.destination || '',
          nights: r.data.nights || '',
          days: r.data.days || '',
          qualification_amount: r.data.qualification_amount || '',
          start_date: r.data.start_date ? r.data.start_date.split('T')[0] : '',
          end_date: r.data.end_date ? r.data.end_date.split('T')[0] : '',
        });
      }
    } catch {}
  };

  useEffect(() => {
    fetchRequests(); fetchUsers(); fetchMedia(); fetchAdminStats(); fetchCurrentPhoto(); fetchTrip(); fetchAnnouncement(); fetchFestivalOffer();
    const interval = setInterval(() => { fetchRequests(); fetchUsers(); }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user?.username) fetchMyTeam();
  }, [user?.username]);

  const fetchPkgClicks = async (month) => {
    try {
      const res = await API.get(`/api/dashboard/stats?pkgMonth=${month}`);
      setPkgClicks(res.data.packageClicks || {});
    } catch {}
  };

  useEffect(() => {
    fetchPkgClicks(pkgMonth);
  }, [pkgMonth]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    socket.on(`live:count:${user?.username}`, count => setLiveCount(count));
    socket.on(`pkg:click:${user?.username}`, () => fetchPkgClicks(pkgMonth));
    socket.on('notification:admin', (notif) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
    });
    return () => socket.disconnect();
  }, [user?.username, pkgMonth]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const totalDays = trip.start_date && trip.end_date
    ? Math.ceil((new Date(trip.end_date) - new Date(trip.start_date)) / (1000 * 60 * 60 * 24))
    : 0;
  const remainingDays = trip.end_date
    ? Math.max(0, Math.ceil((new Date(trip.end_date) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleTripChange = (e) => setTrip({ ...trip, [e.target.name]: e.target.value });

  const saveTrip = async () => {
    if (!trip.destination || !trip.nights || !trip.days || !trip.qualification_amount || !trip.start_date || !trip.end_date) {
      setTripMsg('❌ Please fill all fields!'); return;
    }
    setTripLoading(true); setTripMsg('');
    try {
      await API.post('/api/admin/trip', trip);
      setTripMsg('✅ Trip details saved successfully!');
      setTimeout(() => setTripMsg(''), 3000);
    } catch { setTripMsg('❌ Failed to save!'); }
    finally { setTripLoading(false); }
  };

  const handleProfileOpen = () => { fetchProfile(); setProfileOpen(true); };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) { setUploadMsg('❌ Only JPG, JPEG, PNG allowed!'); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadMsg('❌ File size must be under 10MB!'); return; }
    setUploading(true); setUploadMsg('');
    const fd = new FormData(); fd.append('photo', file);
    try {
      const res = await API.post('/api/profile/upload-photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPhotoUrl(res.data.url);
      setUploadMsg(`✅ Photo updated! (v${res.data.version})`);
      setTimeout(() => setUploadMsg(''), 3000);
    } catch (err) { setUploadMsg(`❌ ${err.response?.data?.message || 'Upload failed'}`); }
    finally { setUploading(false); }
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    switch (searchBy) {
      case 'username': return u.username?.toLowerCase().includes(q);
      case 'email': return u.email?.toLowerCase().includes(q);
      case 'mobile': return u.mobile?.includes(q);
      case 'referral': return u.referral_link?.toLowerCase().includes(q);
      default: return true;
    }
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(referralPageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const approve = async (id) => { 
  try { 
    await API.put(`/api/admin/approve/${id}`); 
    setMsg('✅ User approved!'); 
    fetchRequests(); 
    fetchUsers();
    if (teamModal.open && currentTeamUsername) {
      const r = await API.get(`/api/admin/team/${currentTeamUsername}`);
      setTeamModal(prev => ({ ...prev, members: r.data }));
    }
  } catch { setMsg('❌ Error'); } 
};

const reject = async (id) => { 
  if (!window.confirm('Suspend this user?')) return; 
  try { 
    await API.put(`/api/admin/reject/${id}`); 
    setMsg('❌ User suspended.'); 
    fetchRequests(); 
    fetchUsers();
    if (teamModal.open && currentTeamUsername) {
      const r = await API.get(`/api/admin/team/${currentTeamUsername}`);
      setTeamModal(prev => ({ ...prev, members: r.data }));
    }
  } catch { setMsg('❌ Error'); } 
};
  const deleteUser = async (id) => { if (!window.confirm('Delete this user permanently?')) return; try { await API.delete(`/api/admin/users/${id}`); setMsg('🗑️ User deleted.'); fetchUsers(); } catch { setMsg('❌ Error'); } };
  const uploadBanner = async (e) => { const file = e.target.files[0]; if (!file) return; const fd = new FormData(); fd.append('image', file); try { await API.post('/api/admin/media/banner', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); setMsg('✅ Banner uploaded!'); fetchMedia(); } catch { setMsg('❌ Upload failed'); } };
  const uploadProof = async (e) => { const files = Array.from(e.target.files); for (const file of files) { const fd = new FormData(); fd.append('image', file); try { await API.post('/api/admin/media/proof', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); } catch {} } setMsg('✅ Proofs uploaded!'); fetchMedia(); };
  const deleteMedia = async (id) => { if (!window.confirm('Delete this image?')) return; try { await API.delete(`/api/admin/media/${id}`); setMsg('🗑️ Image deleted.'); fetchMedia(); } catch { setMsg('❌ Error'); } };
  const handleLogout = () => { logout(); navigate('/login'); };

 
  const handleShare = async () => {
  const url = `${window.location.origin}/${user?.username}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Team Aaryan', text: '🚀 Join Team Aaryan and start earning today!', url });
    } catch {}
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent('🚀 Join Team Aaryan and start earning today! ' + url)}`, '_blank');
  }
};








  const fetchMyTeam = async () => {
    try {
      const r = await API.get(`/api/admin/team/${user?.username}`);
      setMyTeam(r.data);
      setMyTeamLoaded(true);
    } catch { setMsg('❌ Error fetching team'); }
  };

  const fetchTeamMembers = async (username) => {
  try {
    const r = await API.get(`/api/admin/team/${username}`);
    setTeamModal({ open: true, user: username, members: r.data });
    setCurrentTeamUsername(username);
  } catch { setMsg('❌ Error fetching team'); }
};

  const fetchUserProfile = async (id) => {
  setViewProfileLoading(true);
  try {
    const r = await API.get(`/api/admin/user-profile/${id}`);
    setViewProfile(r.data);
  } catch {} finally { setViewProfileLoading(false); }
};

  const getChartData = () => {
    if (!adminStats) return [];
    const year = new Date().getFullYear();
    const monthStr = `${year}-${String(selectedMonth + 1).padStart(2, '0')}`;
    const daysInMonth = new Date(year, selectedMonth + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = String(i + 1).padStart(2, '0');
      return { label: String(i + 1), clicks: adminStats.daily?.[`${monthStr}-${day}`] || 0 };
    });
  };

  return (
    <div className="dash-page">
      <div className="dash-header">
     {/*   <div className="dash-logo"><h2>Team <span>Aaryan</span> — Admin</h2></div> */}
	<div className="teamlogo">
          <a href="/dashboard">
           <img src="/assets/teamlogo.png"
                 onError={e => e.target.style.display='none'} alt="TeamAaryan" />
          </a>
        </div>
        <div className="dash-user">
          <div className="header-avatar" onClick={handleProfileOpen}>
            {photoUrl ? <img src={photoUrl} alt="profile" className="header-avatar-img" /> : <span>{user?.full_name?.charAt(0).toUpperCase()}</span>}
          </div>
        {/*  <span className="profile-name-btn" onClick={handleProfileOpen}>👑 {user?.full_name}</span> */}
          <div className="notif-logout-wrap">
            <button className="notif-bell-btn" onClick={() => { setNotifOpen(true); markAllRead(); }}>
              🔔
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>
          </div>
        </div>
      </div>

      {msg && <div className="admin-msg" onClick={() => setMsg('')}>{msg} <small>(click to dismiss)</small></div>}

      <div className="ud-tab-bar">
        {[
          { key: 'requests', label: 'Pending', icon: `📥` },
          { key: 'users', label: 'All Users', icon: '👥' },
          { key: 'myteam', label: 'My Team', icon: '👥' },
          { key: 'mystats', label: 'My Stats', icon: '📊' },
          { key: 'media', label: 'Media', icon: '🖼️' },
          { key: 'messages', label: 'Queries', icon: '📩' },
          { key: 'mylink', label: 'My Link', icon: '🔗' },
        ].map(t => (
          <button key={t.key} className={`ud-tab ${tab === t.key ? 'ud-tab-active' : ''}`} onClick={() => setTab(t.key)}>
            <span>{t.icon}</span>
            <span className="ud-tab-label">{t.key === 'requests' ? `Pending (${requests.length})` : t.label}</span>
          </button>
        ))}
      </div>

      <div className="admin-body">

        {tab === 'requests' && (
          <div>
            <h3 className="admin-section-title">📥 Pending Access Requests</h3>
            {requests.length === 0 ? <div className="admin-empty">No pending requests 🎉</div>
              : requests.map(u => (
  <div key={u._id} className="admin-card-new">
    <div className="admin-card-left">
      <div className="admin-card-avatar">
        {u.photoUrl
          ? <img src={u.photoUrl} alt="profile" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} />
          : u.full_name?.charAt(0).toUpperCase()
        }
      </div>
      <div className="admin-card-info-new">
        <div className="admin-card-name">{u.full_name}</div>
        <div className="admin-card-meta">
          @{u.username} &nbsp;
          <span className="admin-badge pending">pending</span>
        </div>
        <div className="admin-card-meta">
          📅 {new Date(u.createdAt).toLocaleDateString()} &nbsp;|&nbsp; ⏱️ {daysSince(u.createdAt)} days ago
        </div>
      </div>
    </div>
    <div className="admin-card-actions-new">
      <button className="btn-view" onClick={() => fetchUserProfile(u._id)}>👁️ Profile</button>
      <button className="btn-approve" onClick={() => approve(u._id)}>✅ Approve</button>
      <button className="btn-reject" onClick={() => reject(u._id)}>❌ Reject</button>
    </div>
  </div>
))

    }
      </div>
        )}

        {tab === 'users' && (
          <div>
            <h3 className="admin-section-title">👥 All Users ({filteredUsers.length}/{users.length})</h3>
            <div className="search-bar">
              <select className="search-select" value={searchBy} onChange={e => { setSearchBy(e.target.value); setSearchQuery(''); }}>
                <option value="username">👤 Username</option>
                <option value="email">📧 Email</option>
                <option value="mobile">📱 Mobile</option>
                <option value="referral">🔗 Referral Code</option>
              </select>
              <input className="search-input" placeholder={`Search by ${searchBy}...`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              {searchQuery && <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>}
            </div>
            {filteredUsers.length === 0 ? <div className="admin-empty">No users found 🔍</div>

      : filteredUsers.map(u => (
  <div key={u._id} className="admin-card-new">
    {/* Left — Avatar + Info */}
    <div className="admin-card-left">

     <div className="admin-card-avatar">
      {u.photoUrl
        ? <img src={u.photoUrl} alt="profile" style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}} />
        : u.full_name?.charAt(0).toUpperCase()
      }
    </div>      

      <div className="admin-card-info-new">
        <div className="admin-card-name">{u.full_name}</div>
        <div className="admin-card-meta">
          @{u.username} &nbsp;
          <span className={`admin-badge ${u.status}`}>{u.status}</span>
        </div>

        <div className="admin-card-meta">
  👁️ {u.totalClicks} clicks &nbsp;|&nbsp; 📅 {daysSince(u.createdAt)} days ago
</div>
<div className="admin-card-meta">
  👥 Direct: {u.directTeam} &nbsp;|&nbsp; 1st Level: {u.firstLevelCount}
</div>
<div className="admin-card-meta">
  🌳 Total Team: {u.totalTeam}
</div>



      </div>
    </div>
    {/* Right — Action Buttons */}
    <div className="admin-card-actions-new">
      <button className="btn-view" onClick={() => fetchUserProfile(u._id)}>👁️ Profile</button>
      {u.status === 'pending' && <button className="btn-approve" onClick={() => approve(u._id)}>Approve</button>}
      {u.status === 'active' && <button className="btn-reject" onClick={() => reject(u._id)}>Suspend</button>}
      {(u.status === 'suspended' || u.status === 'rejected') && <button className="btn-approve" onClick={() => approve(u._id)}>Approve</button>}
      <button className="btn-team" onClick={() => fetchTeamMembers(u.username)}>👥</button>
      <button className="btn-delete" onClick={() => deleteUser(u._id)}>🗑️</button>
    </div>
  </div>
))

            }
          </div>
        )}



    {/* MY TEAM TAB */}
    {tab === 'myteam' && (() => {
  const filteredMyTeam = myTeam.filter(u => {
    if (!myTeamSearchQuery.trim()) return true;
    const q = myTeamSearchQuery.toLowerCase().trim();
    switch (myTeamSearchBy) {
      case 'username': return u.username?.toLowerCase().includes(q);
      case 'email': return u.email?.toLowerCase().includes(q);
      case 'mobile': return u.mobile?.includes(q);
      case 'referral': return u.referral_link?.toLowerCase().includes(q);
      default: return true;
    }
  });
  return (
  <div>
    <h3 className="admin-section-title">👥 My Direct Team ({filteredMyTeam.length}/{myTeam.length})</h3>
    <div className="search-bar" style={{marginBottom:'1rem'}}>
      <select className="search-select" value={myTeamSearchBy}
        onChange={e => { setMyTeamSearchBy(e.target.value); setMyTeamSearchQuery(''); }}>
        <option value="username">👤 Username</option>
        <option value="email">📧 Email</option>
        <option value="mobile">📱 Mobile</option>
        <option value="referral">🔗 Referral Code</option>
      </select>
      <input className="search-input" placeholder={`Search by ${myTeamSearchBy}...`}
        value={myTeamSearchQuery} onChange={e => setMyTeamSearchQuery(e.target.value)} />
      {myTeamSearchQuery && <button className="search-clear" onClick={() => setMyTeamSearchQuery('')}>✕</button>}
    </div>
    {!myTeamLoaded
      ? <div className="admin-empty">Loading...</div>
      : filteredMyTeam.length === 0
      ? <div className="admin-empty">No direct team members yet</div>
      : filteredMyTeam.map(u => (
          <div key={u._id} className="admin-card-new">
            <div className="admin-card-left">
              <div className="admin-card-avatar">
                {u.photoUrl
                  ? <img src={u.photoUrl} alt="profile" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} />
                  : u.full_name?.charAt(0).toUpperCase()
                }
              </div>
              <div className="admin-card-info-new">
                <div className="admin-card-name">{u.full_name}</div>
                <div className="admin-card-meta">@{u.username} &nbsp;<span className={`admin-badge ${u.status}`}>{u.status}</span></div>
                <div className="admin-card-meta">👁️ {u.totalClicks} clicks &nbsp;|&nbsp; 📅 {daysSince(u.createdAt)} days ago</div>
                <div className="admin-card-meta">👥 Direct: {u.directTeam} &nbsp;|&nbsp; 1st Level: {u.firstLevelCount}</div>
                <div className="admin-card-meta">🌳 Total Team: {u.totalTeam}</div>
              </div>
            </div>
            <div className="admin-card-actions-new">
              <button className="btn-view" onClick={() => fetchUserProfile(u._id)}>👁️ Profile</button>
              {u.status === 'pending' && <button className="btn-approve" onClick={() => approve(u._id)}>✅</button>}
              {u.status === 'active' && <button className="btn-reject" onClick={() => reject(u._id)}>🚫</button>}
              {(u.status === 'suspended' || u.status === 'rejected') && <button className="btn-approve" onClick={() => approve(u._id)}>✅</button>}
              <button className="btn-team" onClick={() => fetchTeamMembers(u.username)}>👥</button>
              <button className="btn-delete" onClick={() => deleteUser(u._id)}>🗑️</button>
            </div>
          </div>
        ))
    }
  </div>
  );
})()}


 {tab === 'mystats' && <>

  {/* Stats Cards */}
  <h3 className="admin-section-title">📊 Live  Visitors Stats</h3>
  <div className="live-badge">
    <span className="live-dot"></span>
    Live Now: <strong>{liveCount}</strong> <p className="info"> visitors on your page</p>
  </div>

  <div className="dash-card">
    <div style={{display: 'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.20rem'}}>
      <h3 className="admin-section-title"> 📊 My Visitors Stats </h3>
      <button className="refresh-btn" onClick={fetchAdminStats}
        disabled={refreshTimer > 0} title="Refresh stats">
        {refreshTimer > 0 ? `⏳ ${refreshTimer}s` : '🔄 Refresh'}
      </button>
    </div>

    <div className="stats-grid">
      <div className="stat-card">
        <FaCalendarDay className="icon-today"/>
        <div className="stat-num">{adminStats?.today ?? '—'}</div>
        <div className="stat-label">Today</div>
      </div>
      <div className="stat-card">
        <FcPlanner className="icon-week"/>
        <div className="stat-num">{adminStats?.week ?? '—'}</div>
        <div className="stat-label">This Week</div>
      </div>
      <div className="stat-card">
        <FcCalendar className="icon-month"/>
        <div className="stat-num">{adminStats?.month ?? '—'}</div>
        <div className="stat-label">This Month</div>
      </div>
    </div>
  </div>

  {/* Graph */}
  <div className="dash-card">
    <div style={{display: 'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.20rem'}}>
      <h3 className="admin-section-title"> Click Analytics 📈</h3>
      <select className="view-select" value={selectedMonth}
        onChange={e => setSelectedMonth(Number(e.target.value))}>
        {months.map((m, i) => (
          <option key={i} value={i}>{m}</option>
        ))}
      </select>
    </div>
    {adminStats ? (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={getChartData()}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="label" stroke="#aaa" tick={{ fontSize: 11 }} />
          <YAxis stroke="#aaa" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#1a0a2e', border: '1px solid crimson', color: '#fff' }}
            formatter={(value) => [`${value} clicks`, 'Clicks']}
            labelFormatter={(label) => `Day ${label}`}
          />
          <Bar dataKey="clicks" fill="crimson" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <div className="graph-loading">Loading analytics...</div>
    )}
  </div>

  {/* Package Clicks */}
  <div className="dash-card pkg-monitor-card">
    <div className="pkg-clicks-header">
      <h3 className="admin-section-title">
        <span className="pkg-monitor-icon">📡</span> Advanced Monitoring
      </h3>
      <select className="search-select" value={pkgMonth}
        onChange={e => setPkgMonth(e.target.value)}>
        {Array.from({length: 12}, (_, i) => {
          const d = new Date(); d.setMonth(d.getMonth() - i);
          const val = d.toISOString().substring(0, 7);
          const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
          return <option key={val} value={val}>{label}</option>;
        })}
      </select>
    </div>
    {[
      { slug:'starter-package',  name:'Starter',      color:'#00eeff' },
      { slug:'intermediate',     name:'Intermediate', color:'#a855f7' },
      { slug:'expert',           name:'Expert',       color:'#f59e0b' },
      { slug:'master',           name:'Master',       color:'#10b981' },
      { slug:'brahmastra',       name:'Brahmastra',   color:'#ef4444' },
      { slug:'premium-pro',      name:'Premium Pro',  color:'#ec4899' },
    ].map((p, _, arr) => {
      const maxVal = Math.max(...arr.map(x => pkgClicks[x.slug] || 0), 1);
      const val = pkgClicks[p.slug] || 0;
      const pct = (val / maxVal) * 100;
      return (
        <div key={p.slug} className="pkg-bar-row">
          <span className="pkg-bar-dot" style={{ background: p.color }} />
          <span className="pkg-bar-name">{p.name}</span>
          <div className="pkg-bar-track">
            <div className="pkg-bar-fill" style={{ width: `${pct}%`, background: p.color }} />
          </div>
          <span className="pkg-bar-count" style={{ color: p.color }}>{val}</span>
        </div>
      );
    })}
  </div>

</>}









{tab === 'media' && (
  <div>
    {/* Announcement Toggle */}
    <div className="media-section">
      <h3 className="admin-section-title">📢 Announcement Bar</h3>
      <div className="announcement-toggle-row">
        <span className="announcement-label">Current Status:</span>
        <div className={`announcement-toggle ${announcementActive ? 'active' : 'paused'}`}
          onClick={toggleAnnouncement}>
          <div className="announcement-dot" />
          <span className="announcement-status">
            {announcementActive ? 'Active' : 'Paused'}
          </span>
        </div>
      </div>
      <p className="media-hint">
        {announcementActive ? 'Announcement bar is Live.' : 'Announcement bar is hidden.'}
      </p>
    </div>


            {/* Trip Offer — Banner + Details in one div */}
            <div className="media-section">
              <h3 className="admin-section-title">🗺️ Trip Offer</h3>

              {/* Trip Banner */}
              <div className="media-banner-preview">
                {media.banner ? <img src={media.banner.url} alt="Current Banner" /> : <div className="media-placeholder">No banner uploaded yet</div>}
              </div>
              <button className="upload-btn" onClick={() => bannerRef.current.click()}>📤 Upload Trip Banner</button>
              <input ref={bannerRef} type="file" accept="image/*" style={{display:'none'}} onChange={uploadBanner} />
              <p className="media-hint">Uploading a new banner replaces the existing one automatically.</p>

              {/* Trip Details */}
              <div style={{marginTop:'1.2rem'}}>
                {tripMsg && <div className={tripMsg.includes('✅') ? 'auth-success' : 'auth-error'} style={{marginBottom:'1rem'}}>{tripMsg}</div>}
                <div className="trip-form">
                  <div className="auth-field">
                    <label>Destination</label>
                    <input name="destination" placeholder="e.g. Nainital & Jim Corbett Park" value={trip.destination} onChange={handleTripChange} />
                  </div>
                  <div className="trip-row">
                    <div className="auth-field">
                      <label>Nights</label>
                      <input name="nights" type="number" placeholder="3" value={trip.nights} onChange={handleTripChange} />
                    </div>
                    <div className="auth-field">
                      <label>Days</label>
                      <input name="days" type="number" placeholder="4" value={trip.days} onChange={handleTripChange} />
                    </div>
                  </div>
                  <div className="auth-field">
                    <label>Qualification Amount (₹)</label>
                    <input name="qualification_amount" type="number" placeholder="89000" value={trip.qualification_amount} onChange={handleTripChange} />
                  </div>
                  <div className="trip-row">
                    <div className="auth-field">
                      <label>Start Date</label>
                      <input name="start_date" type="date" value={trip.start_date} onChange={handleTripChange} />
                    </div>
                    <div className="auth-field">
                      <label>End Date</label>
                      <input name="end_date" type="date" value={trip.end_date} onChange={handleTripChange} />
                    </div>
                  </div>
                  {trip.start_date && trip.end_date && (
                    <div className="trip-calc">
                      <div className="trip-calc-item">
                        <span>📅 Total Days:</span>
                        <strong>{totalDays} Days</strong>
                      </div>
                      <div className="trip-calc-item">
                        <span>⏳ Remaining Days:</span>
                        <strong style={{color: remainingDays > 0 ? '#0ef' : 'crimson'}}>
                          {remainingDays > 0 ? `${remainingDays} Days` : 'Offer Expired'}
                        </strong>
                      </div>
                    </div>
                  )}
                  <button className="upload-btn" onClick={saveTrip} disabled={tripLoading}>
                    {tripLoading ? 'Saving...' : '💾 Save Trip Details'}
                  </button>
                </div>
              </div>
            </div>

            {/* Festival Offer */}
            <div className="media-section">
              <h3 className="admin-section-title">🎉 Festival Price Offer</h3>

              {/* Toggle */}
              <div className="announcement-toggle-row">
                <span className="announcement-label">Status:</span>
                <div className={`announcement-toggle ${festivalOffer.active ? 'active' : 'paused'}`}
                  onClick={() => setFestivalOffer(prev => ({ ...prev, active: !prev.active }))}>
                  <div className="announcement-dot" />
                  <span className="announcement-status">{festivalOffer.active ? 'Active' : 'Paused'}</span>
                </div>
              </div>

              {/* Dates */}
              <div className="trip-form" style={{marginTop:'1rem'}}>
                <div className="trip-field">
                  <label>Start Date</label>
                  <input type="date" className="trip-input" value={festivalOffer.startDate}
                    onChange={e => setFestivalOffer(prev => ({ ...prev, startDate: e.target.value }))} />
                </div>
                <div className="trip-field">
                  <label>End Date</label>
                  <input type="date" className="trip-input" value={festivalOffer.endDate}
                    onChange={e => setFestivalOffer(prev => ({ ...prev, endDate: e.target.value }))} />
                </div>
              </div>

              {/* Marquee Text */}
              <div className="trip-field" style={{marginTop:'.8rem'}}>
                <label>Marquee Text</label>
                <input type="text" className="trip-input" placeholder="🔥 30% OFF! Starter ₹182 | Intermediate ₹360..."
                  value={festivalOffer.marqueeText}
                  onChange={e => setFestivalOffer(prev => ({ ...prev, marqueeText: e.target.value }))} />
              </div>

              {/* Festival Banner */}
              <div style={{marginTop:'1rem'}}>
                <label className="announcement-label">Festival Banner</label>
                <div className="media-banner-preview" style={{marginTop:'.5rem'}}>
                  {festivalOffer.bannerUrl
                    ? <img src={festivalOffer.bannerUrl} alt="Festival Banner" />
                    : <div className="media-placeholder">No festival banner uploaded</div>}
                </div>
                <button className="upload-btn" style={{marginTop:'.5rem'}} onClick={() => festivalBannerRef.current.click()}>
                  📤 Upload Festival Banner
                </button>
                <input ref={festivalBannerRef} type="file" accept="image/*" style={{display:'none'}} onChange={uploadFestivalBanner} />
                <p className="media-hint">Same size as trip banner. Shown in popup during festival offer.</p>
              </div>

              {/* Package Prices */}
              <div style={{marginTop:'1.2rem'}}>
                <h4 style={{color:'#0ef', marginBottom:'.8rem'}}>📦 Festival Package Prices</h4>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%', borderCollapse:'collapse', fontSize:'.82rem'}}>
                    <thead>
                      <tr style={{color:'#aaa', borderBottom:'1px solid #333'}}>
                        <th style={{padding:'.5rem', textAlign:'left'}}>Package</th>
                        <th style={{padding:'.5rem'}}>Amount ₹</th>
                        <th style={{padding:'.5rem'}}>Direct ₹</th>
                        <th style={{padding:'.5rem'}}>Passive ₹</th>
                      </tr>
                    </thead>
                    <tbody>
                      {festivalOffer.packages.map(p => (
                        <tr key={p.slug} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                          <td style={{padding:'.5rem', color:'#ccc'}}>{p.name}</td>
                          <td style={{padding:'.5rem'}}>
                            <input type="number" className="trip-input" style={{width:'80px', textAlign:'center'}}
                              value={p.amount} onChange={e => updateFestivalPkg(p.slug, 'amount', e.target.value)} />
                          </td>
                          <td style={{padding:'.5rem'}}>
                            <input type="number" className="trip-input" style={{width:'80px', textAlign:'center'}}
                              value={p.direct} onChange={e => updateFestivalPkg(p.slug, 'direct', e.target.value)} />
                          </td>
                          <td style={{padding:'.5rem'}}>
                            <input type="number" className="trip-input" style={{width:'80px', textAlign:'center'}}
                              value={p.passive} onChange={e => updateFestivalPkg(p.slug, 'passive', e.target.value)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <button className="upload-btn" style={{marginTop:'1rem', width:'100%'}} onClick={saveFestivalOffer}>
                💾 Save Festival Offer
              </button>
              <p className="media-hint">When active + dates valid → Festival prices & banner shown on ReferralPage. After expiry → Trip offer returns automatically.</p>
            </div>

            {/* Proof Images */}
            <div className="media-section">
              <h3 className="admin-section-title">📸 Earnings Proof Images ({media.proofs?.length || 0}/20)</h3>
              <button className="upload-btn" onClick={() => proofRef.current.click()} disabled={(media.proofs?.length || 0) >= 20}>📤 Upload Proof Images</button>
              <input ref={proofRef} type="file" accept="image/*" multiple style={{display:'none'}} onChange={uploadProof} />
              <p className="media-hint">Max 20 images allowed. Click ❌ to delete any image.</p>
              <div className="proof-grid">
                {(media.proofs || []).map((img, i) => (
                  <div key={img._id} className="proof-item">
                    <img src={img.url} alt={`proof-${i+1}`} />
                    <button className="proof-delete" onClick={() => deleteMedia(img._id)}>❌</button>
                  </div>

                ))}
              </div>
            </div>
          </div>
        )}

{tab === 'messages' && (
  <div>
    <h3 className="admin-section-title">📩 Contact Messages</h3>
    <MessagesTab />
  </div>
)}


{/* ── MY LINK TAB ── */}
{tab === 'mylink' && (
  <div>
    <h3 className="admin-section-title">🔗 My Personalized Link </h3>
    <div className="dash-card">
      <h3>My Referral Page</h3>
      <div className="ref-link-box">
        <span className="ref-link-text">{`${window.location.origin}/${user?.username}`}</span>
        <button className="copy-btn" onClick={handleCopy}>
              {copied ? '✅ Copied' : '📋 Copy'}
            </button>
      </div>

      <div style={{marginTop:'.8rem', display:'flex', gap:'.3rem', justifyContent:'center'}}>
        <a href={`/${user?.username}`} target="_blank" rel="noreferrer" className="preview-btn">
          👁️ Preview My Page
        </a>
	<button className="share-btn" onClick={handleShare}>🔗 Share</button>
      </div>

    </div>

    {/* QR Code */}
    <div className="dash-card" style={{textAlign:'center'}}>
      <h3 style={{marginBottom:'1rem'}}>📱 QR Code</h3>
      <div className="qr-wrap">
        <QRCodeSVG
          value={`${window.location.origin}/${user?.username}`}
          size={180}
          bgColor="#0f0820"
          fgColor="#00eeff"
          level="H"
          includeMargin={true}
          imageSettings={{
            src: "data:image/svg+xml;utf8," + encodeURIComponent(`
              <svg xmlns='http://www.w3.org/2000/svg' width='50' height='36'>
                <rect width='50' height='36' rx='6' fill='%230f0820'/>
                <text x='25' y='16' font-family='Arial' font-weight='800' font-size='13' fill='white' text-anchor='middle'>Team</text>
                <text x='25' y='31' font-family='Arial' font-weight='800' font-size='13' fill='crimson' text-anchor='middle'>Aaryan</text>
              </svg>
            `),
            width: 50,
            height: 36,
            excavate: true,
          }}
        />
      </div>
      <p className="qr-hint">Scan to visit your referral page</p>
    </div>
  </div>
)}


</div>



      {/* Profile Drawer */}
      {profileOpen && (
        <div className="drawer-overlay" onClick={() => setProfileOpen(false)}>
          <div className="profile-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>👑 Admin Profile</h3>
              <button className="drawer-close" onClick={() => setProfileOpen(false)}>✕</button>
            </div>
            {profile ? (
              <div className="drawer-body">
                <div className="profile-photo-section">
                  <div className="profile-avatar-large">
                    {photoUrl ? <img src={photoUrl} alt="profile" className="profile-avatar-img" /> : <span>{profile.full_name?.charAt(0).toUpperCase()}</span>}
                    <button className="photo-edit-btn" onClick={() => photoRef.current.click()} disabled={uploading}>{uploading ? '⏳' : '📷'}</button>
                  </div>
                  <input ref={photoRef} type="file" accept="image/jpeg,image/jpg,image/png" style={{display:'none'}} onChange={handlePhotoUpload} />
                  {uploadMsg && <div className="upload-msg">{uploadMsg}</div>}
                  <p className="photo-hint">JPG, JPEG, PNG • Max 10MB</p>
                </div>
                <div className="profile-name">{profile.full_name}</div>
                <div className="profile-username">@{profile.username} <span style={{color:'crimson', fontSize:'.75rem'}}>ADMIN</span></div>
                <div className="profile-divider"></div>
                <div className="profile-item"><span className="profile-icon">📧</span><div><div className="profile-label">Email</div><div className="profile-value">{profile.email}</div></div></div>
                <div className="profile-item"><span className="profile-icon">📱</span><div><div className="profile-label">Mobile</div><div className="profile-value">{profile.mobile}</div></div></div>
                <div className="profile-item"><span className="profile-icon">🎂</span><div><div className="profile-label">Date of Birth</div><div className="profile-value">{profile.dob}</div></div></div>
                <div className="profile-item"><span className="profile-icon">🔗</span><div><div className="profile-label">Referral Link</div><div className="profile-value profile-value-small"><a href={profile.referral_link} target="_blank" rel="noreferrer">{profile.referral_link}</a></div></div></div>
                <div className="profile-divider"></div>
                <div className="profile-item"><span className="profile-icon">📅</span><div><div className="profile-label">Member Since</div><div className="profile-value">{new Date(profile.createdAt).toLocaleDateString()}</div></div></div>
                <div style={{textAlign:'center', marginTop:'1.5rem', paddingBottom:'.5rem'}}>
                  <button className="drawer-logout-btn" onClick={handleLogout}>🚪 Logout</button>
                </div>
              </div>
            ) : <div className="graph-loading">Loading profile...</div>}
          </div>
        </div>
      )}

      {/* Team Members Modal */}
{teamModal.open && (
  <div className="drawer-overlay" onClick={() => { setTeamModal({ open: false, user: null, members: [] }); setMemberDetail(null); }}>
    <div className="profile-drawer" onClick={e => e.stopPropagation()}>
      <div className="drawer-header">
        <h3>👥 @{teamModal.user}'s Team ({teamModal.members.length})</h3>
        <button className="drawer-close" onClick={() => { setTeamModal({ open: false, user: null, members: [] }); setMemberDetail(null); }}>✕</button>
      </div>
      <div className="drawer-body">
        {teamModal.members.length === 0
          ? <div className="admin-empty">No team members yet</div>
          : teamModal.members.map(m => (
    <div key={m._id} className="admin-card-new">
      <div className="admin-card-left">
        <div className="admin-card-avatar">
          {m.photoUrl
            ? <img src={m.photoUrl} alt="profile" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} />
            : m.full_name?.charAt(0).toUpperCase()
          }
        </div>
        <div className="admin-card-info-new">
          <div className="admin-card-name">{m.full_name}</div>
          <div className="admin-card-meta">
            @{m.username} &nbsp;
            <span className={`admin-badge ${m.status}`}>{m.status}</span>
          </div>
          
          <div className="admin-card-meta">
  👁️ {m.totalClicks} clicks &nbsp;|&nbsp; 📅 {daysSince(m.createdAt)} days ago
</div>
<div className="admin-card-meta">
  👥 Direct: {m.directTeam} &nbsp;|&nbsp; 1st Level: {m.firstLevelCount}
</div>
<div className="admin-card-meta">
  🌳 Total Team: {m.totalTeam}
</div>
      
        </div>
      </div>
      <div className="admin-card-actions-new">
        <button className="btn-view" onClick={() => fetchUserProfile(m._id)}>👁️ Profile</button>
        {m.status === 'pending' && <button className="btn-approve" onClick={() => approve(m._id)}>✅</button>}
        {m.status === 'active' && <button className="btn-reject" onClick={() => reject(m._id)}>🚫</button>}
        {(m.status === 'suspended' || m.status === 'rejected') && <button className="btn-approve" onClick={() => approve(m._id)}>✅</button>}
        <button className="btn-team" onClick={() => fetchTeamMembers(m.username)}>👥</button>
        <button className="btn-delete" onClick={() => deleteUser(m._id)}>🗑️</button>
      </div>
    </div>
  ))
      }
      </div>
    </div>
  </div>
)}

{/* Member Detail Popup */}
{memberDetail && (
  <div className="drawer-overlay" onClick={() => setMemberDetail(null)}>
    <div className="member-detail-popup" onClick={e => e.stopPropagation()}>
      <div className="drawer-header">
        <h3>👤 {memberDetail.full_name}</h3>
        <button className="drawer-close" onClick={() => setMemberDetail(null)}>✕</button>
      </div>
      <div className="drawer-body">
        <div className="profile-item"><span className="profile-icon">👤</span><div><div className="profile-label">Username</div><div className="profile-value">@{memberDetail.username}</div></div></div>
        <div className="profile-item"><span className="profile-icon">📧</span><div><div className="profile-label">Email</div><div className="profile-value">{memberDetail.email}</div></div></div>
        <div className="profile-item"><span className="profile-icon">📱</span><div><div className="profile-label">Mobile</div><div className="profile-value">{memberDetail.mobile}</div></div></div>
        <div className="profile-item"><span className="profile-icon">🎂</span><div><div className="profile-label">Date of Birth</div><div className="profile-value">{memberDetail.dob}</div></div></div>
        <div className="profile-item"><span className="profile-icon">🗺️</span><div><div className="profile-label">Location</div><div className="profile-value">{memberDetail.district}, {memberDetail.state} - {memberDetail.pincode}</div></div></div>
        <div className="profile-item"><span className="profile-icon">🔗</span><div><div className="profile-label">Referral Link</div><div className="profile-value profile-value-small"><a href={memberDetail.referral_link} target="_blank" rel="noreferrer">{memberDetail.referral_link}</a></div></div></div>
        <div className="profile-item"><span className="profile-icon">📅</span><div><div className="profile-label">Joined</div><div className="profile-value">{new Date(memberDetail.createdAt).toLocaleDateString()} ({daysSince(memberDetail.createdAt)} days ago)</div></div></div>
        <div className="profile-item"><span className="profile-icon">👥</span><div><div className="profile-label">Referred By</div><div className="profile-value">@{memberDetail.referred_by}</div></div></div>
      </div>
    </div>
  </div>
)}


{/* View Profile Drawer */}
{viewProfile && (
  <div className="drawer-overlay" onClick={() => setViewProfile(null)}>
    <div className="profile-drawer" onClick={e => e.stopPropagation()}>
      <div className="drawer-header">
        <h3>👤 User Profile</h3>
        <button className="drawer-close" onClick={() => setViewProfile(null)}>✕</button>
      </div>
      <div className="drawer-body">
        <div className="profile-photo-section">
          <div className="profile-avatar-large">
            {viewProfile.photoUrl
              ? <img src={viewProfile.photoUrl} alt="profile" className="profile-avatar-img" />
              : <span>{viewProfile.full_name?.charAt(0).toUpperCase()}</span>
            }
          </div>
        </div>
        <div className="profile-name">{viewProfile.full_name}</div>
        <div className="profile-username">@{viewProfile.username} <span className={`admin-badge ${viewProfile.status}`}>{viewProfile.status}</span></div>
        <div className="profile-divider"></div>
        <div className="profile-item"><span className="profile-icon">📧</span><div><div className="profile-label">Email</div><div className="profile-value">{viewProfile.email}</div></div></div>
        <div className="profile-item"><span className="profile-icon">📱</span><div><div className="profile-label">Mobile</div><div className="profile-value">{viewProfile.mobile}</div></div></div>
        <div className="profile-item"><span className="profile-icon">🎂</span><div><div className="profile-label">Date of Birth</div><div className="profile-value">{viewProfile.dob}</div></div></div>
        <div className="profile-item"><span className="profile-icon">🗺️</span><div><div className="profile-label">Location</div><div className="profile-value">{viewProfile.district}, {viewProfile.state} - {viewProfile.pincode}</div></div></div>
        <div className="profile-item"><span className="profile-icon">🔗</span><div><div className="profile-label">Referral Link</div><div className="profile-value profile-value-small"><a href={viewProfile.referral_link} target="_blank" rel="noreferrer">{viewProfile.referral_link}</a></div></div></div>
        <div className="profile-item"><span className="profile-icon">👥</span><div><div className="profile-label">Referred By</div><div className="profile-value">@{viewProfile.referred_by}</div></div></div>
        <div className="profile-item"><span className="profile-icon">📅</span><div><div className="profile-label">Joined</div><div className="profile-value">{new Date(viewProfile.createdAt).toLocaleDateString()} ({daysSince(viewProfile.createdAt)} days ago)</div></div></div>
      </div>
    </div>
  </div>
)}


{/* Notification Drawer */}
{notifOpen && (
  <NotificationDrawer
    notifications={notifications}
    setNotifications={setNotifications}
    unreadCount={unreadCount}
    setUnreadCount={setUnreadCount}
    onClose={() => setNotifOpen(false)}
  />
)}

    </div>
  );
};

export default AdminDashboard;
