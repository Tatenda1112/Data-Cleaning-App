import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import {
    AppBar,
    Toolbar,
    Container,
    Box,
    Grid,
    Typography,
    Button,
    CircularProgress,
    Paper,
    CssBaseline,
    Alert,
    Snackbar,
    Divider,
    Switch,
    Menu,
    MenuItem,
    Avatar,
} from '@mui/material';
import { 
    CloudUpload, 
    Download, 
    Settings, 
    Logout, 
    AdminPanelSettings,
    Folder,
    Person
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Login from './components/Login';
import Register from './components/Register';
import ProjectManager from './components/ProjectManager';
import AdminDashboard from './components/AdminDashboard';

const initialTransformers = [
    { transformer_name: 'mandatory_columns', config: { mandatory_columns: [] } },
    { transformer_name: 'numeric_converter', config: { columns: [] } },
    { transformer_name: 'whitespace_case_cleaner', config: { columns: [], case: 'upper' } },
    { transformer_name: 'missing_values_detector', config: {} },
    { transformer_name: 'id_validator', config: { id_column: '' } },
    { transformer_name: 'negative_zero_checker', config: { columns: [] } },
    { transformer_name: 'duplicate_identifier', config: { columns: [] } },
    { transformer_name: 'date_converter', config: { columns: [] } },
    { transformer_name: 'year_filter', config: { date_column: '', start_year: '', end_year: '' } },
    { transformer_name: 'start_end_comparator', config: { start_year_column: '', end_year_column: '' } },
    { transformer_name: 'unique_id_generator', config: { id_column: '', columns_to_concat: [] } },
    { transformer_name: 'column_filter', config: { columns_to_keep: [] } },
];

function App() {
    // Auth state
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    
    // App state
    const [file, setFile] = useState(null);
    const [columns, setColumns] = useState([]);
    const [preview, setPreview] = useState([]);
    const [transformers, setTransformers] = useState(initialTransformers);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [activeSection, setActiveSection] = useState('projects');
    const [mode, setMode] = useState('light');
    const [issuesReady, setIssuesReady] = useState(false);
    const [summaryReady, setSummaryReady] = useState(false);
    const [summary, setSummary] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);

    // Auth functions
    const handleLogin = async (token) => {
        setToken(token);
        localStorage.setItem('token', token);
        try {
            const response = await axios.get('http://localhost:8000/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(response.data);
            setShowLogin(false);
        } catch (err) {
            console.error('Failed to get user info:', err);
        }
    };

    const handleLogout = () => {
        setToken(null);
        setUser(null);
        setSelectedProject(null);
        setActiveSection('projects');
        localStorage.removeItem('token');
        setAnchorEl(null);
    };

    const handleRegister = () => {
        setShowRegister(false);
        setShowLogin(true);
    };

    // Fetch user info on mount
    useEffect(() => {
        if (token) {
            axios.get('http://localhost:8000/me', {
                headers: { Authorization: `Bearer ${token}` }
            }).then(response => {
                setUser(response.data);
            }).catch(() => {
                handleLogout();
            });
        }
    }, [token]);

    const handleFileUpload = (event) => {
        setFile(event.target.files[0]);
        setMessage('');
    };

    const uploadFile = async () => {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8000/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setColumns(response.data.columns || []);
            setPreview(response.data.preview || []);
            setIssuesReady(false);
            setSummaryReady(false);
            setSummary(null);
            setMessage(response.data.message || 'File uploaded successfully.');
            setSnackbarOpen(true);
        } catch (error) {
            setMessage(`File upload failed: ${error.response?.data?.detail || error.message}`);
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleConfigChange = (index, configKey, value) => {
        const newTransformers = [...transformers];
        newTransformers[index].config[configKey] = value;
        setTransformers(newTransformers);
    };

    const runDataChecks = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8000/identify-issues');
            setIssuesReady(true);
            // Try to immediately fetch summary JSON for the dashboard
            try {
                const res = await axios.get('http://localhost:8000/download-issues-summary', { responseType: 'blob' });
                const text = await res.data.text();
                const json = JSON.parse(text);
                setSummary(json);
                setSummaryReady(true);
            } catch (_) {
                setSummary(null);
                setSummaryReady(false);
            }
            setMessage(response.data.message || 'Issue detection complete.');
            setSnackbarOpen(true);
        } catch (error) {
            setMessage(`Issue detection failed: ${error.response?.data?.detail || error.message}`);
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const downloadFile = async (type) => {
        try {
            const endpoint = type === 'issues' ? 'download-issues' : 'download-issues-summary';
            const response = await axios.get(`http://localhost:8000/${endpoint}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            // Try to use server-provided filename; fallback based on type
            const contentDisposition = response.headers['content-disposition'] || '';
            const match = contentDisposition.match(/filename="?([^";]+)"?/);
            const fallback = type === 'issues' ? 'data_issues.xlsx' : 'data_issues.json';
            link.setAttribute('download', match ? match[1] : fallback);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            setMessage(`Download failed: ${error.response?.data?.detail || error.message}`);
            setSnackbarOpen(true);
        }
    };

    const theme = useMemo(() => createTheme({
        palette: {
            mode,
            primary: { main: '#1976d2' },
            secondary: { main: '#00a3a3' },
            background: {
                default: mode === 'dark' ? '#0f172a' : '#f8fafb',
                paper: mode === 'dark' ? '#111827' : '#ffffff'
            }
        },
        typography: {
            fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
        },
        shape: { borderRadius: 10 },
        components: {
            MuiPaper: { styleOverrides: { root: { border: '1px solid rgba(0,0,0,0.06)' } } },
            MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } }
        }
    }), [mode]);

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    // Show login/register if not authenticated
    if (!token) {
        if (showRegister) {
            return (
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <Register onRegister={handleRegister} onSwitchToLogin={() => setShowRegister(false)} />
                </ThemeProvider>
            );
        }
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Login onLogin={handleLogin} onSwitchToRegister={() => setShowLogin(true)} />
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppBar position="fixed" color="primary" elevation={0}>
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                        DatViz
                    </Typography>
                    <Typography variant="body2" sx={{ mr: 1 }}>{mode === 'dark' ? 'Dark' : 'Light'} mode</Typography>
                    <Switch checked={mode === 'dark'} onChange={() => setMode(mode === 'dark' ? 'light' : 'dark')} />
                    <Button
                        color="inherit"
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        startIcon={<Avatar sx={{ width: 24, height: 24 }}>{user?.username?.[0]?.toUpperCase()}</Avatar>}
                    >
                        {user?.username}
                    </Button>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                    >
                        <MenuItem onClick={handleLogout}>
                            <Logout sx={{ mr: 1 }} />
                            Logout
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Box sx={{ display: 'flex' }}>
                {/* Sidebar */}
                <Box sx={{ width: 240, pt: 9, px: 2, borderRight: 1, borderColor: 'divider', minHeight: '100vh', position: 'sticky', top: 0 }}>
                    <Typography variant="overline" color="text.secondary">Navigation</Typography>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button 
                            variant={activeSection === 'projects' ? 'contained' : 'text'} 
                            onClick={() => setActiveSection('projects')} 
                            startIcon={<Folder />}
                        >
                            Projects
                        </Button>
                        {selectedProject && (
                            <>
                                <Button 
                                    variant={activeSection === 'upload' ? 'contained' : 'text'} 
                                    onClick={() => setActiveSection('upload')} 
                                    startIcon={<CloudUpload />}
                                >
                                    Upload
                                </Button>
                                <Button 
                                    variant={activeSection === 'check' ? 'contained' : 'text'} 
                                    onClick={() => setActiveSection('check')} 
                                    startIcon={<Settings />}
                                >
                                    Check
                                </Button>
                                <Button 
                                    variant={activeSection === 'download' ? 'contained' : 'text'} 
                                    onClick={() => setActiveSection('download')} 
                                    startIcon={<Download />}
                                >
                                    Download
                                </Button>
                            </>
                        )}
                        {user?.is_admin && (
                            <Button 
                                variant={activeSection === 'admin' ? 'contained' : 'text'} 
                                onClick={() => setActiveSection('admin')} 
                                startIcon={<AdminPanelSettings />}
                            >
                                Admin
                            </Button>
                        )}
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="caption" color="text.secondary">
                        {selectedProject ? `Project: ${selectedProject.name}` : 'Select a project to start'}
                    </Typography>
                </Box>

                {/* Main content */}
                <Box component="main" sx={{ flexGrow: 1, pt: 9 }}>
                    <Container maxWidth="lg" sx={{ mb: 4 }}>
                        {activeSection === 'projects' && (
                            <ProjectManager 
                                token={token} 
                                onSelectProject={(project) => {
                                    setSelectedProject(project);
                                    setActiveSection('upload');
                                }} 
                            />
                        )}

                        {activeSection === 'admin' && user?.is_admin && (
                            <AdminDashboard token={token} />
                        )}

                        {selectedProject && (
                            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                                {activeSection === 'upload' && (
                        <Box textAlign="center">
                            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
                                Step 1: Upload Your Data File
                            </Typography>
                            <Box
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.[0]) { setFile(e.dataTransfer.files[0]); } }}
                                sx={{
                                    border: '2px dashed',
                                    borderColor: dragOver ? 'primary.main' : 'grey.300',
                                    borderRadius: 2,
                                    p: 6,
                                    textAlign: 'center',
                                    bgcolor: dragOver ? 'grey.50' : 'transparent',
                                    transition: 'all .2s',
                                }}
                            >
                                <CloudUpload color="primary" sx={{ fontSize: 48, mb: 1 }} />
                                <Typography variant="h6" sx={{ mb: 2 }}>Drag & drop your file here</Typography>
                                <Typography variant="body2" color="text.secondary">or</Typography>
                                <Box mt={2}>
                                    <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} id="file-upload" />
                                    <label htmlFor="file-upload">
                                        <Button variant="contained" component="span" startIcon={<CloudUpload />} size="large">
                                            Choose File
                                        </Button>
                                    </label>
                                </Box>
                            </Box>
                            {file && (
                                <Button
                                    variant="contained"
                                    onClick={uploadFile}
                                    disabled={loading}
                                    startIcon={loading ? <CircularProgress size={20} /> : <Settings />}
                                    sx={{ mt: 2 }}
                                >
                                    Upload & Preview
                                </Button>
                            )}
                            {preview.length > 0 && (
                                <Box mt={4}>
                                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                        Data Preview
                                    </Typography>
                                    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr>
                                                    {columns.map((col) => (
                                                        <th key={col} style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                                                            {col}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {preview.map((row, i) => (
                                                    <tr key={i}>
                                                        {columns.map((col) => (
                                                            <td key={col} style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                                                                {row[col]}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                            )}

                            {activeSection === 'check' && (
                        <Box>
                            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
                                Step 2: Run Data Checks
                            </Typography>
                            <Box textAlign="center">
                                <Button
                                    variant="contained"
                                    onClick={runDataChecks}
                                    disabled={loading || !columns.length}
                                    startIcon={loading ? <CircularProgress size={20} /> : <Settings />}
                                    size="large"
                                >
                                    {columns.length ? 'Run Checks' : 'Upload data first'}
                                </Button>
                            </Box>

                            {summaryReady && summary && (
                                <Box mt={4}>
                                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Dashboard</Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                                                <Typography variant="body2" color="text.secondary">Columns</Typography>
                                                <Typography variant="h5">{(summary.columns || []).length}</Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                                                <Typography variant="body2" color="text.secondary">Preview Rows</Typography>
                                                <Typography variant="h5">{preview.length}</Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                                                <Typography variant="body2" color="text.secondary">Checks Status</Typography>
                                                <Typography variant="h6">Ready</Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                                                <Typography variant="body2" color="text.secondary">Timestamp (UTC)</Typography>
                                                <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>{summary.timestamp}</Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                    {/* Checks table */}
                                    {!!(summary.checks || []).length && (
                                        <Box mt={3}>
                                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Checks</Typography>
                                            <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr>
                                                            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #eee' }}>Check</th>
                                                            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee', width: 120 }}>Issues</th>
                                                            <th style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Visualization</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(() => {
                                                            const rows = summary.checks || [];
                                                            const max = Math.max(1, ...rows.map(r => r.issues || 0));
                                                            return rows.map((r, idx) => (
                                                                <tr key={idx}>
                                                                    <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{r.check}</td>
                                                                    <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{r.issues}</td>
                                                                    <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>
                                                                        <div style={{ background: '#e5e7eb', height: 8, borderRadius: 4, position: 'relative' }}>
                                                                            <div style={{
                                                                                width: `${Math.round(((r.issues || 0) / max) * 100)}%`,
                                                                                height: 8,
                                                                                borderRadius: 4,
                                                                                background: '#1976d2'
                                                                            }} />
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ));
                                                        })()}
                                                    </tbody>
                                                </table>
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            )}

                            {issuesReady && !summaryReady && (
                                <Box mt={3}>
                                    <Alert severity="info">Checks completed. Go to Download to get the reports.</Alert>
                                </Box>
                            )}
                        </Box>
                            )}

                            {activeSection === 'download' && (
                        <Box textAlign="center">
                            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
                                Step 3: Download Reports
                            </Typography>
                            <Grid container spacing={2} justifyContent="center">
                                <Grid item>
                                    <Button
                                        variant="contained"
                                        onClick={() => downloadFile('issues')}
                                        startIcon={<Download />}
                                        size="large"
                                        disabled={!issuesReady}
                                    >
                                        Download Issues (.xlsx)
                                    </Button>
                                </Grid>
                                <Grid item>
                                    <Button
                                        variant="outlined"
                                        onClick={() => downloadFile('issues-summary')}
                                        startIcon={<Download />}
                                        size="large"
                                        disabled={!summaryReady}
                                    >
                                        Download Summary (.json)
                                    </Button>
                                </Grid>
                            </Grid>
                                </Box>
                            )}
                            </Paper>
                        )}

                        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
                            <Alert onClose={handleSnackbarClose} severity={message.includes('failed') ? 'error' : 'success'} sx={{ width: '100%' }}>
                                {message}
                            </Alert>
                        </Snackbar>
                    </Container>
                </Box>
            </Box>
        </ThemeProvider>
    );
}

export default App;