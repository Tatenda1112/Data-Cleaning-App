import React from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  Paper,
  Chip
} from '@mui/material';
import { 
  DataObject, 
  Analytics, 
  CloudUpload, 
  Security, 
  Speed, 
  CheckCircle,
  TrendingUp,
  Storage
} from '@mui/icons-material';

const LandingPage = ({ onGetStarted }) => {
  const features = [
    {
      icon: <DataObject sx={{ fontSize: 40, color: '#1976d2' }} />,
      title: "Data Quality Detection",
      description: "Automatically identify missing values, duplicates, outliers, and data inconsistencies across your datasets."
    },
    {
      icon: <Analytics sx={{ fontSize: 40, color: '#1976d2' }} />,
      title: "Advanced Analytics",
      description: "Perform comprehensive data analysis with built-in statistical tools and visualization capabilities."
    },
    {
      icon: <CloudUpload sx={{ fontSize: 40, color: '#1976d2' }} />,
      title: "Easy Data Upload",
      description: "Support for multiple file formats including CSV, Excel, and more. Simple drag-and-drop interface."
    },
    {
      icon: <Security sx={{ fontSize: 40, color: '#1976d2' }} />,
      title: "Secure & Private",
      description: "Your data stays secure with enterprise-grade encryption and user-based access controls."
    },
    {
      icon: <Speed sx={{ fontSize: 40, color: '#1976d2' }} />,
      title: "Lightning Fast",
      description: "Process large datasets quickly with optimized algorithms and efficient data processing pipelines."
    },
    {
      icon: <Storage sx={{ fontSize: 40, color: '#1976d2' }} />,
      title: "Project Management",
      description: "Organize your data projects with user-friendly project management and collaboration features."
    }
  ];

  const benefits = [
    "Seamless Data Cleaning Experience",
    "Advanced Data Analysis and Visualization", 
    "Scalable and Cloud-Ready Platform",
    "User-Friendly Interface",
    "Real-time Data Validation",
    "Comprehensive Reporting"
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Hero Section */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        py: 8,
        textAlign: 'center'
      }}>
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
            DatViz
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, opacity: 0.9, maxWidth: '800px', mx: 'auto' }}>
            Comprehensive Data Preparation and Analysis Tool
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.8, maxWidth: '600px', mx: 'auto' }}>
            Make data cleaning, validation, and exploration accessible to businesses of all sizes. 
            Transform your raw data into actionable insights with minimal technical expertise.
          </Typography>
          <Button 
            variant="contained" 
            size="large" 
            onClick={onGetStarted}
            sx={{ 
              bgcolor: 'white', 
              color: '#1976d2',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: '#f5f5f5'
              }
            }}
          >
            Get Started Now
          </Button>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom sx={{ mb: 6, color: '#1a202c' }}>
          Why Choose DatViz?
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card sx={{ 
                height: '100%', 
                textAlign: 'center',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Benefits Section */}
      <Box sx={{ bgcolor: '#f1f5f9', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" component="h2" gutterBottom sx={{ color: '#1a202c', mb: 4 }}>
                Our Primary Objectives
              </Typography>
              <Box sx={{ mb: 4 }}>
                {benefits.map((benefit, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckCircle sx={{ color: '#10b981', mr: 2, fontSize: 20 }} />
                    <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                      {benefit}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'white' }}>
                <TrendingUp sx={{ fontSize: 80, color: '#1976d2', mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Data-Driven Decisions
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Empower your team to make informed decisions through robust analysis 
                  and visualization features, offering accurate, actionable insights.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" component="h2" gutterBottom sx={{ color: '#1a202c', mb: 3 }}>
            Ready to Transform Your Data?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, color: '#64748b' }}>
            Join thousands of businesses already using DatViz to clean, validate, and analyze their data.
          </Typography>
          <Button 
            variant="contained" 
            size="large" 
            onClick={onGetStarted}
            sx={{ 
              px: 6,
              py: 2,
              fontSize: '1.2rem',
              fontWeight: 'bold'
            }}
          >
            Start Your Data Journey
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
