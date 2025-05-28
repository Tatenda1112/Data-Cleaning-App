import React, { useState } from 'react';
import axios from 'axios';
import {
    AppBar,
    Toolbar,
    Tabs,
    Tab,
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
} from '@mui/material';
import { CloudUpload, Download, Settings } from '@mui/icons-material';
import TransformerForm from './TransformerForm';

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
    const [file, setFile] = useState(null);
    const [columns, setColumns] = useState([]);
    const [preview, setPreview] = useState([]);
    const [transformers, setTransformers] = useState(initialTransformers);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

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
            setColumns(response.data.columns);
            const fetchResponse = await axios.get('http://localhost:8000/fetch-data');
            setPreview(fetchResponse.data.preview);
            setMessage(response.data.message);
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

    const submitTransformers = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8000/process-data', { transformers });
            setMessage(response.data.message);
            setSnackbarOpen(true);
        } catch (error) {
            setMessage(`Configuration failed: ${error.response?.data?.detail || error.message}`);
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const downloadFile = async (type) => {
        try {
            const response = await axios.get(`http://localhost:8000/download-${type}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            setMessage(`Download failed: ${error.response?.data?.detail || error.message}`);
            setSnackbarOpen(true);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        setMessage('');
    };

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    return (
        <>
            <CssBaseline />
            <AppBar position="static" color="primary" elevation={0}>
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                        Data Transformation Lab
                    </Typography>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        textColor="inherit"
                        indicatorColor="secondary"
                    >
                        <Tab icon={<CloudUpload />} label="Upload" />
                        <Tab icon={<Settings />} label="Transform" />
                        <Tab icon={<Download />} label="Download" />
                    </Tabs>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                    {activeTab === 0 && (
                        <Box textAlign="center">
                            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
                                Step 1: Upload Your Data File
                            </Typography>
                            <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} id="file-upload" />
                            <label htmlFor="file-upload">
                                <Button variant="contained" component="span" startIcon={<CloudUpload />} size="large">
                                    Select File
                                </Button>
                            </label>
                            {file && (
                                <Button
                                    variant="contained"
                                    onClick={uploadFile}
                                    disabled={loading}
                                    startIcon={loading ? <CircularProgress size={20} /> : <Settings />}
                                    sx={{ mt: 2, ml: 2 }}
                                >
                                    Upload & Process
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

                    {activeTab === 1 && (
                        <Box>
                            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
                                Step 2: Configure Transformers
                            </Typography>
                            <Grid container spacing={3}>
                                {transformers.map((transformer, index) => (
                                    <Grid item xs={12} sm={6} md={4} key={index}>
                                        <TransformerForm
                                            transformer={transformer}
                                            columns={columns}
                                            onConfigChange={(configKey, value) => handleConfigChange(index, configKey, value)}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                            <Box textAlign="center" mt={4}>
                                <Button variant="contained" onClick={submitTransformers} startIcon={<Settings />} size="large">
                                    Submit Configuration
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {activeTab === 2 && (
                        <Box textAlign="center">
                            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
                                Step 3: Download Processed Data
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => downloadFile('cleaned')}
                                startIcon={<Download />}
                                sx={{ mr: 2 }}
                                size="large"
                            >
                                Download Cleaned Data
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() => downloadFile('issues')}
                                startIcon={<Download />}
                                size="large"
                            >
                                Download Data Issues
                            </Button>
                        </Box>
                    )}
                </Paper>

                <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
                    <Alert onClose={handleSnackbarClose} severity={message.includes('failed') ? 'error' : 'success'} sx={{ width: '100%' }}>
                        {message}
                    </Alert>
                </Snackbar>
            </Container>
        </>
    );
}

export default App;