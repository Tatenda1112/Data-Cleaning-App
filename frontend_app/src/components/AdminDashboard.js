import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    TablePagination
} from '@mui/material';
import {
    People as PeopleIcon,
    Folder as FolderIcon,
    Assessment as AssessmentIcon,
    History as HistoryIcon
} from '@mui/icons-material';
import axios from 'axios';

export default function AdminDashboard({ token }) {
    const [activeTab, setActiveTab] = useState(0);
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchData = async () => {
        try {
            const [statsRes, usersRes, logsRes] = await Promise.all([
                axios.get('http://localhost:8000/admin/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:8000/admin/users', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:8000/admin/logs', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
            setLogs(logsRes.data);
        } catch (err) {
            setError('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>Admin Dashboard</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <PeopleIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                        {stats?.total_users || 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Users
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <PeopleIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                        {stats?.active_users || 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Active Users
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <FolderIcon color="info" sx={{ mr: 2, fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                        {stats?.total_projects || 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Projects
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <HistoryIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                        {stats?.total_logs || 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Logs
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                    <Tab label="Users" icon={<PeopleIcon />} />
                    <Tab label="Activity Logs" icon={<HistoryIcon />} />
                </Tabs>
            </Box>

            {/* Users Tab */}
            {activeTab === 0 && (
                <TableContainer component={Paper} elevation={2}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Username</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Full Name</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Last Login</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.username}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.full_name || '-'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.is_admin ? 'Admin' : 'User'}
                                            color={user.is_admin ? 'error' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.is_active ? 'Active' : 'Inactive'}
                                            color={user.is_active ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {user.last_login
                                            ? new Date(user.last_login).toLocaleString()
                                            : 'Never'
                                        }
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Logs Tab */}
            {activeTab === 1 && (
                <TableContainer component={Paper} elevation={2}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>User</TableCell>
                                <TableCell>Action</TableCell>
                                <TableCell>Details</TableCell>
                                <TableCell>IP Address</TableCell>
                                <TableCell>Timestamp</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {logs
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>{log.user?.username || 'Unknown'}</TableCell>
                                        <TableCell>
                                            <Chip label={log.action} size="small" color="primary" />
                                        </TableCell>
                                        <TableCell>
                                            {log.details ? JSON.stringify(log.details) : '-'}
                                        </TableCell>
                                        <TableCell>{log.ip_address || '-'}</TableCell>
                                        <TableCell>
                                            {new Date(log.created_at).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={logs.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </TableContainer>
            )}
        </Box>
    );
}
