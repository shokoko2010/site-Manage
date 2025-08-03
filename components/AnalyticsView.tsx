// components/AnalyticsView.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

const AnalyticsView: React.FC = () => {
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [referralData, setReferralData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const postsSnapshot = await getDocs(collection(db, "posts"));
      const posts = postsSnapshot.docs.map(doc => doc.data());

      // Process traffic data
      const traffic: { [key: string]: number } = {};
      posts.forEach(post => {
        const date = format(post.createdAt.toDate(), 'MMM dd');
        if (traffic[date]) {
          traffic[date] += post.views;
        } else {
          traffic[date] = post.views;
        }
      });
      const formattedTraffic = Object.keys(traffic).map(date => ({ date, views: traffic[date] })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setTrafficData(formattedTraffic);

      // Process referral data
      const referrals: { [key: string]: number } = {};
      posts.forEach(post => {
        if (referrals[post.source]) {
          referrals[post.source]++;
        } else {
          referrals[post.source] = 1;
        }
      });
      const formattedReferrals = Object.keys(referrals).map(name => ({ name, value: referrals[name] }));
      setReferralData(formattedReferrals);
      
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analytics
      </Typography>
      <Grid container spacing={3} display="flex">
        <Grid item xs={12} component="div">
          <Paper sx={{ p: 2 }} component="div">
            <Typography variant="h6" gutterBottom>
              Website Traffic (Last 30 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Social Media Referrals
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={referralData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {referralData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsView;
