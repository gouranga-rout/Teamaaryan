import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import API from '../api';
import { MdOutlineAnalytics } from "react-icons/md";
import '../App.css';
import { FaCalendarDay } from "react-icons/fa";
import { FcCalendar,FcPlanner } from "react-icons/fc";

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


const months = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const daysSince = (dateStr) => {
  if (!dateStr) return '?';
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// Reusable Profile Drawer for team members
const MemberProfileDrawer = ({ member, onClose }) => {
  if (!member) return null;
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="profile-drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>👤 {member.full_name}</h3>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>
        <div className="drawer-body">
          <div className="profile-photo-section">
            <div className="profile-avatar-large">
              {member.photoUrl
                ? <img src={member.photoUrl} alt="profile" className="profile-avatar-img" />
                : <span>{member.full_name?.charAt(0).toUpperCase()}</span>
              }
            </div>
          </div>
          <div className="profile-name">{member.full_name}</div>
          <div className="profile-username">@{member.username} <span className={`admin-badge ${member.status}`}>{member.status}</span></div>
          <div className="profile-divider"></div>
          <div className="profile-item"><span className="profile-icon">📧</span><div><div className="profile-label">Email</div><div className="profile-value">{member.email}</div></div></div>
          <div className="profile-item"><span className="profile-icon">📱</span><div><div className="profile-label">Mobile</div><div className="profile-value">{member.mobile}</div></div></div>
          <div className="profile-item"><span className="profile-icon">🎂</span><div><div className="profile-label">Date of Birth</div><div className="profile-value">{member.dob}</div></div></div>
          <div className="profile-item"><span className="profile-icon">🗺️</span><div><div className="profile-label">Location</div><div className="profile-value">{member.district}, {member.state} - {member.pincode}</div></div></div>
          <div className="profile-item"><span className="profile-icon">🔗</span><div><div className="profile-label">Referral Link</div><div className="profile-value profile-value-small"><a href={member.referral_link} target="_blank" rel="noreferrer">{member.referral_link}</a></div></div></div>
          <div className="profile-item"><span className="profile-icon">👥</span><div><div className="profile-label">Referred By</div><div className="profile-value">@{member.referred_by}</div></div></div>
          <div className="profile-item"><span className="profile-icon">👁️</span><div><div className="profile-label">Total Clicks</div><div className="profile-value">{member.totalClicks}</div></div></div>
          <div className="profile-item"><span className="profile-icon">📅</span><div><div className="profile-label">Joined</div><div className="profile-value">{new Date(member.createdAt).toLocaleDateString()} ({daysSince(member.createdAt)} days ago)</div></div></div>
        </div>
      </div>
    </div>
  );
};

// Reusable Team Member Card
const TeamMemberCard = ({ m, onProfileClick, onTeamClick }) => (
  <div className="admin-card-new">
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
      <button className="btn-view" onClick={() => onProfileClick(m)}>👁️ Profile</button>
      <button className="btn-team" onClick={() => onTeamClick(m.username)}>👥</button>
    </div>
  </div>
);

// Recursive Team Modal - works for infinite levels
  const TeamModal = ({ username, onClose }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [subTeamUsername, setSubTeamUsername] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await API.get(`/api/user/team/${username}`);
        setMembers(res.data);
      } catch {}
      finally { setLoading(false); }
    };
    fetchMembers();
  }, [username]);


  return (
    <>
      <div className="drawer-overlay" onClick={onClose}>
        <div className="profile-drawer" onClick={e => e.stopPropagation()}>
          <div className="drawer-header">
            <h3>👥 @{username}'s Team ({members.length})</h3>
            <button className="drawer-close" onClick={onClose}>✕</button>
          </div>
          <div className="drawer-body">
            {loading
              ? <div className="graph-loading">Loading...</div>
              : members.length === 0
              ? <div className="admin-empty">No team members yet</div>
              : members.map(m => (
                  <TeamMemberCard
                    key={m._id}
                    m={m}
                    onProfileClick={setSelectedProfile}
                    onTeamClick={setSubTeamUsername}
                  />
                ))
            }
          </div>
        </div>
      </div>

      {/* Profile drawer for member inside this modal */}
      {selectedProfile && (
        <MemberProfileDrawer
          member={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}

      {/* Recursive sub-team modal - infinite levels! */}
      {subTeamUsername && (
        <TeamModal
          username={subTeamUsername}
          onClose={() => setSubTeamUsername(null)}
        />
      )}
    </>
  );
};

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const referralPageUrl = `${window.location.origin}/${user?.username}`;
  const [copied, setCopied] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const photoRef = useRef();
  const [refreshTimer, setRefreshTimer] = useState(0);
  const [teamMembers, setTeamMembers] = useState([]);
  const [memberDetail, setMemberDetail] = useState(null);
  const [subTeamUsername, setSubTeamUsername] = useState(null);
  const [searchBy, setSearchBy] = useState('username');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveCount, setLiveCount] = useState(0);
  const [pkgMonth, setPkgMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [pkgClicks, setPkgClicks] = useState({});
  const [activeTab, setActiveTab] = useState('stats');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);


  const fetchStats = async () => {
    try {
      const res = await API.get('/api/dashboard/stats');
      setStats(res.data);
      setRefreshTimer(10);
      const interval = setInterval(() => {
        setRefreshTimer(prev => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch {}
  };

  const fetchPkgClicks = async (month) => {
    try {
      const res = await API.get(`/api/dashboard/stats?pkgMonth=${month}`);
      setPkgClicks(res.data.packageClicks || {});
    } catch {}
  };

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

  useEffect(() => {
    fetchStats();
    fetchCurrentPhoto();
    fetchNotifications();
  }, []);

  useEffect(() => {
    fetchPkgClicks(pkgMonth);
  }, [pkgMonth]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    socket.on(`live:count:${user?.username}`, (count) => setLiveCount(count));
    socket.on(`notification:user:${user?.username}`, (notif) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
    });
    if (user?.username) {
      socket.on(`pkg:click:${user.username}`, () => {
        fetchPkgClicks(pkgMonth);
      });
    }
    return () => socket.disconnect();
  }, [user?.username, pkgMonth]);

  useEffect(() => {
  if (activeTab === 'team') {
    fetchTeamMembers();
  }
}, [activeTab]);

  const fetchCurrentPhoto = async () => {
    try {
      const res = await API.get('/api/profile/photo');
      setPhotoUrl(res.data.url);
    } catch {}
  };

  const fetchProfile = async () => {
    try {
      const res = await API.get('/api/dashboard/profile');
      setProfile(res.data);
    } catch {}
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await API.get(`/api/user/team/${user?.username}`);
      setTeamMembers(res.data);
    } catch {}
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
    } catch (err) {
      setUploadMsg(`❌ ${err.response?.data?.message || 'Upload failed'}`);
    } finally { setUploading(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralPageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  const getChartData = () => {
    if (!stats) return [];
    const year = new Date().getFullYear();
    const monthStr = `${year}-${String(selectedMonth + 1).padStart(2, '0')}`;
    const daysInMonth = new Date(year, selectedMonth + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = String(i + 1).padStart(2, '0');
      const dateKey = `${monthStr}-${day}`;
      return { label: String(i + 1), clicks: stats.daily?.[dateKey] || 0 };
    });
  };


const filteredTeam = teamMembers.filter(m => {
  if (!searchQuery.trim()) return true;
  const q = searchQuery.toLowerCase().trim();
  switch (searchBy) {
    case 'username': return m.username?.toLowerCase().includes(q);
    case 'email': return m.email?.toLowerCase().includes(q);
    case 'mobile': return m.mobile?.includes(q);
    case 'referral': return m.referral_link?.toLowerCase().includes(q);
    default: return true;
  }
});

  return (
    <div className="dash-page">
      {/* Header */}
      <div className="dash-header">
       {/* <div className="dash-logo"><h2>Team <span>Aaryan</span></h2></div>*/}
        <div className="teamlogo">
          <a href="/dashboard">
           <img src="/assets/teamlogo.png"
                 onError={e => e.target.style.display='none'} alt="TeamAaryan" />
          </a>
        </div>         

        <div className="dash-user">
          <div className="header-avatar" onClick={handleProfileOpen}>
            {photoUrl
              ? <img src={photoUrl} alt="profile" className="header-avatar-img" />
              : <span>{user?.full_name?.charAt(0).toUpperCase()}</span>
            }
          </div>

{/*          <span className="profile-name-btn" onClick={handleProfileOpen}>
            👋 {user?.full_name}
          </span>
*/}

          <div className="notif-logout-wrap">
            <button className="notif-bell-btn" onClick={() => { setNotifOpen(true); markAllRead(); }}>
              🔔
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>
          </div>

        </div>
      </div>

      <div className="dash-body">

        {/* Tab Bar */}
        <div className="ud-tab-bar">
          {[
            { id:'stats', label:'Stats', icon:'📊' },
            { id:'team',  label:'My Team', icon:'👥' },
            { id:'link',  label:'My Link', icon:'🔗' },
          ].map(t => (
            <button key={t.id}
              className={`ud-tab ${activeTab === t.id ? 'ud-tab-active' : ''}`}
              onClick={() => setActiveTab(t.id)}>
              <span>{t.icon}</span>
              <span className="ud-tab-label">{t.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'link' && <>
        {/* Referral Link Card */}
        <h3 className="admin-section-title">🔗 My Personalized Link {/* (@{user?.username})*/} </h3>
        <div className="dash-card">
          <h3>My Referral Page</h3>
          <div className="ref-link-box">
            <span className="ref-link-text">{referralPageUrl}</span>
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
              value={referralPageUrl}
              size={180}
              bgColor="#0f0820"
              fgColor="#00eeff"
              level="H"
              includeMargin={true}
              imageSettings={{
              src:window.location.origin + "/assets/Team.png",
              width: 50,
              height: 35,
              excavate: true,
  }}
            />
          </div>
          <p className="qr-hint">Scan to visit your referral page</p>
        </div>

        </>}




        {activeTab === 'stats' && <>

        {/* Stats Cards */}
        <h3 className="admin-section-title">📊 Live  Visitors Stats</h3>
        <div className="live-badge">
          <span className="live-dot"></span>
            Live Now: <strong>{liveCount}</strong> <p className="info"> visitors on your page</p>
        </div>

	<div className="dash-card">
          <div style={{display: 'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.20rem'}}>
             <h3 className="admin-section-title"> 📊 My Visitors Stats </h3>
             <button className="refresh-btn" onClick={fetchStats}
                disabled={refreshTimer > 0} title="Refresh stats">
                {refreshTimer > 0 ? `⏳ ${refreshTimer}s` : '🔄 Refresh'}
             </button>  
	 </div>

           
         
        <div className="stats-grid">
          <div className="stat-card">
            <FaCalendarDay className="icon-today"/>
	    <div className="stat-num">{stats?.today ?? '—'}</div>
            <div className="stat-label">Today</div>
          </div>
          <div className="stat-card">
	    <FcPlanner className="icon-week"/>
            <div className="stat-num">{stats?.week ?? '—'}</div>
            <div className="stat-label">This Week</div>
          </div>
          <div className="stat-card">
	    <FcCalendar className="icon-month"/>
            <div className="stat-num">{stats?.month ?? '—'}</div>
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
          {stats ? (
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
    { slug:'starter-package',  name:'Starter',       color:'#00eeff' },
    { slug:'intermediate',     name:'Intermediate',  color:'#a855f7' },
    { slug:'expert',           name:'Expert',        color:'#f59e0b' },
    { slug:'master',           name:'Master',        color:'#10b981' },
    { slug:'brahmastra',       name:'Brahmastra',    color:'#ef4444' },
    { slug:'premium-pro',      name:'Premium Pro',   color:'#ec4899' },
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



{/* My Team Section */}
  {activeTab === 'team' && <>
{/* My Team Section */}
<h3 className="admin-section-title">👥 My Team ({teamMembers.length})</h3>
<div>
  {teamMembers.length === 0
    ? <div className="admin-empty">No team members yet — share your link!</div>
    : <>
        <div className="search-bar" style={{marginBottom:'1rem'}}>
          <select className="search-select" value={searchBy}
          onChange={e => { setSearchBy(e.target.value); setSearchQuery(''); }}>
          <option value="username">👤 Username</option>
          <option value="email">📧 Email</option>
          <option value="mobile">📱 Mobile</option>
          <option value="referral">🔗 Referral Code</option>
        </select>

          <input className="search-input"
            placeholder={`Search by ${searchBy}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} />
          {searchQuery && <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>}
        </div>
        {filteredTeam.length === 0
          ? <div className="admin-empty">No results found 🔍</div>
          : filteredTeam.map(m => (
              <TeamMemberCard
                key={m._id}
                m={m}
                onProfileClick={setMemberDetail}
                onTeamClick={setSubTeamUsername}
              />
            ))
        }
      </>
  }
</div>
</>}
</div>
  








      {/* My Profile Drawer */}
      {profileOpen && (
        <div className="drawer-overlay" onClick={() => setProfileOpen(false)}>
          <div className="profile-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>👤 My Profile</h3>
              <button className="drawer-close" onClick={() => setProfileOpen(false)}>✕</button>
            </div>
            {profile ? (
              <div className="drawer-body">
                <div className="profile-photo-section">
                  <div className="profile-avatar-large">
                    {photoUrl
                      ? <img src={photoUrl} alt="profile" className="profile-avatar-img" />
                      : <span>{profile.full_name?.charAt(0).toUpperCase()}</span>
                    }
                    <button className="photo-edit-btn" onClick={() => photoRef.current.click()}
                      disabled={uploading} title="Change photo">
                      {uploading ? '⏳' : '📷'}
                    </button>
                  </div>
                  <input ref={photoRef} type="file" accept="image/jpeg,image/jpg,image/png"
                    style={{display:'none'}} onChange={handlePhotoUpload} />
                  {uploadMsg && <div className="upload-msg">{uploadMsg}</div>}
                  <p className="photo-hint">JPG, JPEG, PNG • Max 10MB</p>
                </div>
                <div className="profile-name">{profile.full_name}</div>
                <div className="profile-username">@{profile.username}</div>
                <div className="profile-divider"></div>
                <div className="profile-item"><span className="profile-icon">📧</span><div><div className="profile-label">Email</div><div className="profile-value">{profile.email}</div></div></div>
                <div className="profile-item"><span className="profile-icon">📱</span><div><div className="profile-label">Mobile</div><div className="profile-value">{profile.mobile}</div></div></div>
                <div className="profile-item"><span className="profile-icon">🎂</span><div><div className="profile-label">Date of Birth</div><div className="profile-value">{profile.dob}</div></div></div>
                <div className="profile-item"><span className="profile-icon">🗺️</span><div><div className="profile-label">Location</div><div className="profile-value">{profile.district}, {profile.state} - {profile.pincode}</div></div></div>
                <div className="profile-item"><span className="profile-icon">🔗</span><div><div className="profile-label">Referral Link</div><div className="profile-value profile-value-small"><a href={profile.referral_link} target="_blank" rel="noreferrer">{profile.referral_link}</a></div></div></div>
		‎<div className="profile-item"><span className="profile-icon">👥</span><div><div className="profile-label">Referred By</div><div className="profile-value">@{profile.referred_by}</div></div></div>
                <div className="profile-divider"></div>
                <div className="profile-item"><span className="profile-icon">📅</span><div><div className="profile-label">Member Since</div><div className="profile-value">{new Date(profile.createdAt).toLocaleDateString()}</div></div></div>
                <div style={{textAlign:'center', marginTop:'1.5rem', paddingBottom:'.5rem'}}>
                  <button className="drawer-logout-btn" onClick={handleLogout}>🚪 Logout</button>
                </div>
              </div>
            ) : (
              <div className="graph-loading">Loading profile...</div>
            )}
          </div>
        </div>
      )}

      {/* Member Profile Drawer - side drawer */}
      <MemberProfileDrawer
        member={memberDetail}
        onClose={() => setMemberDetail(null)}
      />

      {/* Recursive Team Modal - infinite levels! */}
      {subTeamUsername && (
        <TeamModal
          username={subTeamUsername}
          onClose={() => setSubTeamUsername(null)}
        />
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

export default UserDashboard;





