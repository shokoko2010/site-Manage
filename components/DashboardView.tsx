// components/DashboardView.tsx
import React from 'react';
import { Box, Grid, Paper, Typography, Button } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const data = [
  { name: 'Jan', uv: 4000, pv: 2400, amt: 2400 },
  { name: 'Feb', uv: 3000, pv: 1398, amt: 2210 },
  { name: 'Mar', uv: 2000, pv: 9800, amt: 2290 },
  { name: 'Apr', uv: 2780, pv: 3908, amt: 2000 },
  { name: 'May', uv: 1890, pv: 4800, amt: 2181 },
  { name: 'Jun', uv: 2390, pv: 3800, amt: 2500 },
  { name: 'Jul', uv: 3490, pv: 4300, amt: 2100 },
];

const generateSampleData = async () => {
  const postsCollection = collection(db, 'posts');
  const sources = ['Facebook', 'Twitter', 'LinkedIn', 'Instagram', 'Direct'];
  const today = new Date();

  for (let i = 0; i < 20; i++) {
    const randomDate = new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // last 30 days
    await addDoc(postsCollection, {
      title: `Sample Post ${i + 1}`,
      createdAt: Timestamp.fromDate(randomDate),
      views: Math.floor(Math.random() * 1000),
      source: sources[Math.floor(Math.random() * sources.length)],
      // In a real app, you would associate this with a team or user
      // teamId: "your_team_id"
    });
  }
  alert('Sample data generated successfully!');
};


const DashboardView: React.FC = () => {
  return (
    <Box>
       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Button variant="contained" color="secondary" onClick={generateSampleData}>
          Generate Sample Data
        </Button>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3} component="div">
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="h6" color="text.secondary">
              Total Posts
            </Typography>
            <Typography component="p" variant="h4">
              1,024
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3} component="div">
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="h6" color="text.secondary">
              Total Views
            </Typography>
            <Typography component="p" variant="h4">
              24,567
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3} component="div">
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="h6" color="text.secondary">
              Comments
            </Typography>
            <Typography component="p" variant="h4">
              1,234
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3} component="div">
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="h6" color="text.secondary">
              Likes
            </Typography>
            <Typography component="p" variant="h4">
              5,678
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} component="div">
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Monthly Performance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pv" fill="#8884d8" />
                <Bar dataKey="uv" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardView;