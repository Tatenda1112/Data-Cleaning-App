import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    Link
} from '@mui/material';
import { Login as LoginIcon, PersonAdd } from '@mui/icons-material';
import axios from 'axios';

export default function Login({ onLogin, onSwitchToRegister }) {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formDataObj = new FormData();
            formDataObj.append('username', formData.username);
            formDataObj.append('password', formData.password);

            const response = await axios.post('http://localhost:8000/token', formDataObj);
            localStorage.setItem('token', response.data.access_token);
            onLogin(response.data.access_token);
        } catch (err) {
            console.error('Login error:', err);
            if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else if (err.message) {
                setError(err.message);
            } else {
                setError('Login failed. Please check if backend is running.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                <Box textAlign="center" mb={3}>
                    <LoginIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Welcome to DatViz</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Sign in to your account
                    </Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        margin="normal"
                        required
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                        sx={{ mt: 3, mb: 2 }}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>

                <Box textAlign="center">
                    <Typography variant="body2">
                        Don't have an account?{' '}
                        <Link component="button" onClick={onSwitchToRegister} sx={{ textDecoration: 'none' }}>
                            Sign up
                        </Link>
                    </Typography>
                </Box>

                <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
                    <Typography variant="caption" color="text.secondary">
                        <strong>Demo credentials:</strong><br />
                        Username: admin<br />
                        Password: admin123
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
}
