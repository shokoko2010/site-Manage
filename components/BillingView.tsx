// components/BillingView.tsx
import React from 'react';
import { Box, Typography, Paper, Button, Grid } from '@mui/material';

const BillingView: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Billing
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Current Plan
            </Typography>
            <Typography variant="h4" gutterBottom>
              Free
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Includes 1 user, 1 website, and 10 posts per month.
            </Typography>
            <Button variant="contained" color="primary">
              Upgrade Plan
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BillingView;
