import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    CardActions,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Chip,
    Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Folder as FolderIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import axios from 'axios';

export default function ProjectManager({ token, onSelectProject }) {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', config: {} });
    const [error, setError] = useState('');

    const fetchProjects = async () => {
        try {
            const response = await axios.get('http://localhost:8000/projects', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProjects(response.data);
        } catch (err) {
            setError('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [token]);

    const handleCreateProject = async () => {
        try {
            const response = await axios.post('http://localhost:8000/projects', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProjects([...projects, response.data]);
            setOpen(false);
            setFormData({ name: '', description: '', config: {} });
        } catch (err) {
            setError('Failed to create project');
        }
    };

    const handleUpdateProject = async () => {
        try {
            const response = await axios.put(`http://localhost:8000/projects/${editingProject.id}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProjects(projects.map(p => p.id === editingProject.id ? response.data : p));
            setOpen(false);
            setEditingProject(null);
            setFormData({ name: '', description: '', config: {} });
        } catch (err) {
            setError('Failed to update project');
        }
    };

    const handleEdit = (project) => {
        setEditingProject(project);
        setFormData({
            name: project.name,
            description: project.description || '',
            config: project.config || {}
        });
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditingProject(null);
        setFormData({ name: '', description: '', config: {} });
    };

    if (loading) {
        return <Box textAlign="center" p={4}><Typography>Loading projects...</Typography></Box>;
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>My Projects</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpen(true)}
                >
                    New Project
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Grid container spacing={3}>
                {projects.map((project) => (
                    <Grid item xs={12} sm={6} md={4} key={project.id}>
                        <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <FolderIcon color="primary" sx={{ mr: 1 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                        {project.name}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {project.description || 'No description'}
                                </Typography>
                                <Box display="flex" gap={1} mb={2}>
                                    <Chip label={project.status} size="small" color="primary" />
                                    <Chip 
                                        label={new Date(project.created_at).toLocaleDateString()} 
                                        size="small" 
                                        variant="outlined" 
                                    />
                                </Box>
                            </CardContent>
                            <CardActions>
                                <Button
                                    size="small"
                                    startIcon={<SettingsIcon />}
                                    onClick={() => onSelectProject(project)}
                                >
                                    Open
                                </Button>
                                <IconButton size="small" onClick={() => handleEdit(project)}>
                                    <EditIcon />
                                </IconButton>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {projects.length === 0 && (
                <Box textAlign="center" py={8}>
                    <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No projects yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Create your first project to get started with data analysis
                    </Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
                        Create Project
                    </Button>
                </Box>
            )}

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingProject ? 'Edit Project' : 'Create New Project'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Project Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        margin="normal"
                        multiline
                        rows={3}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button
                        onClick={editingProject ? handleUpdateProject : handleCreateProject}
                        variant="contained"
                    >
                        {editingProject ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
